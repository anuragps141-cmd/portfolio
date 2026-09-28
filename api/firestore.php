<?php
require __DIR__ . '/bootstrap.php';

$data = getRequestData();
$action = $data['action'] ?? 'get';
$path = trim($data['path'] ?? '', '/');
$query = $data['query'] ?? [];
$orderBy = $data['orderBy'] ?? null;
$limit = isset($data['limit']) ? intval($data['limit']) : null;

function mapPath($path) {
    $parts = array_values(array_filter(explode('/', $path), 'strlen'));
    if (count($parts) === 0) {
        return null;
    }

    switch ($parts[0]) {
        case 'users':
            if (count($parts) === 1) {
                return ['table' => 'users', 'type' => 'collection'];
            }
            if (count($parts) === 2) {
                return ['table' => 'users', 'type' => 'document', 'id' => $parts[1]];
            }
            if (count($parts) === 3 && $parts[2] === 'scanHistory') {
                return ['table' => 'scan_history', 'type' => 'collection', 'parent' => ['user_id' => $parts[1]]];
            }
            break;
        case 'scamReports':
            if (count($parts) === 1) {
                return ['table' => 'scam_reports', 'type' => 'collection'];
            }
            if (count($parts) === 2) {
                return ['table' => 'scam_reports', 'type' => 'document', 'id' => $parts[1]];
            }
            break;
        case 'communityReports':
            if (count($parts) === 1) {
                return ['table' => 'community_reports', 'type' => 'collection'];
            }
            if (count($parts) === 2) {
                return ['table' => 'community_reports', 'type' => 'document', 'id' => $parts[1]];
            }
            break;
        case 'articles':
            if (count($parts) === 1) {
                return ['table' => 'articles', 'type' => 'collection'];
            }
            if (count($parts) === 2) {
                return ['table' => 'articles', 'type' => 'document', 'id' => $parts[1]];
            }
            break;
        case 'admins':
            if (count($parts) === 1) {
                return ['table' => 'admins', 'type' => 'collection'];
            }
            if (count($parts) === 2) {
                return ['table' => 'admins', 'type' => 'document', 'id' => $parts[1]];
            }
            break;
    }
    return null;
}

function applyQueryConditions($stmt, $query, &$params) {
    if (!is_array($query)) {
        return;
    }
    foreach ($query as $condition) {
        if (!isset($condition['field'], $condition['op'], $condition['value'])) {
            continue;
        }
        $field = $condition['field'];
        $op = $condition['op'];
        $value = $condition['value'];
        switch ($op) {
            case '==':
                $stmt .= " AND `$field` = ?";
                $params[] = $value;
                break;
            case '>':
            case '<':
            case '<=':
            case '>=':
                $stmt .= " AND `$field` $op ?";
                $params[] = $value;
                break;
        }
    }
    return $stmt;
}

function buildOrderBy($orderBy) {
    if (!is_array($orderBy) || empty($orderBy['field'])) {
        return '';
    }
    $direction = strtoupper($orderBy['direction'] ?? 'ASC');
    if (!in_array($direction, ['ASC', 'DESC'])) {
        $direction = 'ASC';
    }
    return " ORDER BY `{$orderBy['field']}` $direction";
}

function wrapTimestampFields($row) {
    foreach ($row as $key => $value) {
        if (preg_match('/(timestamp|created_at|updated_at)$/i', $key) && $value) {
            $row[$key] = [
                'seconds' => strtotime($value),
                'value' => $value
            ];
        }
    }
    return $row;
}

$mapping = mapPath($path);
if (!$mapping) {
    jsonResponse(['error' => 'Invalid collection path: ' . $path], 400);
}

global $pdo;

function fetchRow($pdo, $table, $id) {
    $stmt = $pdo->prepare("SELECT * FROM `$table` WHERE id = ? LIMIT 1");
    $stmt->execute([$id]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

function buildCollectionResponse($rows) {
    $docs = [];
    foreach ($rows as $row) {
        $docs[] = [
            'id' => $row['id'],
            'data' => normalizeData(wrapTimestampFields($row))
        ];
    }
    return ['type' => 'collection', 'docs' => $docs];
}

try {
    if ($action === 'get') {
        if ($mapping['type'] === 'document' && isset($mapping['id'])) {
            $row = fetchRow($pdo, $mapping['table'], $mapping['id']);
            if (!$row) {
                jsonResponse(['type' => 'document', 'exists' => false, 'id' => $mapping['id'], 'data' => null]);
            }
            jsonResponse(['type' => 'document', 'exists' => true, 'id' => $row['id'], 'data' => normalizeData(wrapTimestampFields($row))]);
        }

        $sql = "SELECT * FROM `{$mapping['table']}` WHERE 1=1";
        $params = [];
        if (!empty($mapping['parent']) && is_array($mapping['parent'])) {
            foreach ($mapping['parent'] as $field => $value) {
                $sql .= " AND `$field` = ?";
                $params[] = $value;
            }
        }
        $sql = applyQueryConditions($sql, $query, $params);
        $sql .= buildOrderBy($orderBy);
        if ($limit) {
            $sql .= " LIMIT " . intval($limit);
        }
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        jsonResponse(buildCollectionResponse($rows));
    }

    if ($action === 'add') {
        if ($mapping['type'] !== 'collection') {
            jsonResponse(['error' => 'Add action requires collection path'], 400);
        }
        $data = normalizeData($data['data'] ?? []);
        if (!empty($mapping['parent'])) {
            foreach ($mapping['parent'] as $field => $value) {
                $data[$field] = $value;
            }
        }
        $fields = array_keys($data);
        $placeholders = implode(',', array_fill(0, count($fields), '?'));
        $columns = implode('`,`', $fields);
        $stmt = $pdo->prepare("INSERT INTO `{$mapping['table']}` (`$columns`) VALUES ($placeholders)");
        $stmt->execute(array_values($data));
        $newId = $pdo->lastInsertId();
        $row = fetchRow($pdo, $mapping['table'], $newId);
        jsonResponse(['type' => 'document', 'exists' => true, 'id' => $newId, 'data' => normalizeData(wrapTimestampFields($row))]);
    }

    if (in_array($action, ['set', 'update', 'delete'])) {
        if ($mapping['type'] !== 'document' || empty($mapping['id'])) {
            jsonResponse(['error' => ucfirst($action) . ' action requires document path'], 400);
        }
    }

    if ($action === 'set' || $action === 'update') {
        $row = fetchRow($pdo, $mapping['table'], $mapping['id']);
        if (!$row) {
            jsonResponse(['error' => 'Document not found'], 404);
        }
        $data = normalizeData($data['data'] ?? []);
        if (!$data) {
            jsonResponse(['error' => 'No update data provided'], 400);
        }
        $fields = array_keys($data);
        $setSql = implode(', ', array_map(fn($field) => "`$field` = ?", $fields));
        $params = array_values($data);
        $params[] = $mapping['id'];
        $stmt = $pdo->prepare("UPDATE `{$mapping['table']}` SET $setSql, updated_at = NOW() WHERE id = ?");
        $stmt->execute($params);
        $row = fetchRow($pdo, $mapping['table'], $mapping['id']);
        jsonResponse(['type' => 'document', 'exists' => true, 'id' => $mapping['id'], 'data' => normalizeData(wrapTimestampFields($row))]);
    }

    if ($action === 'delete') {
        $stmt = $pdo->prepare("DELETE FROM `{$mapping['table']}` WHERE id = ?");
        $stmt->execute([$mapping['id']]);
        jsonResponse(['success' => true]);
    }

    jsonResponse(['error' => 'Unsupported action'], 400);
} catch (Exception $e) {
    jsonResponse(['error' => $e->getMessage()], 500);
}
