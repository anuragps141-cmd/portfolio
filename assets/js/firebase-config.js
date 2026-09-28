// PHP/MySQL backend adapter for auth and Firestore-style data operations.
(function() {
  const API_BASE = '/api';
  let currentUser = null;
  const authListeners = [];

  function parseJsonResponse(response) {
    if (!response.ok) {
      return response.json().then(data => {
        const message = data.error || response.statusText;
        throw new Error(message);
      });
    }
    return response.json();
  }

  function apiFetch(endpoint, body = {}, method = 'POST') {
    const url = API_BASE + '/' + endpoint;
    const options = { method, headers: {} };

    if (method === 'GET') {
      return fetch(url + '?' + new URLSearchParams(body), options).then(parseJsonResponse);
    }

    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
    return fetch(url, options).then(parseJsonResponse);
  }

  function normalizeTimestampFields(data) {
    if (!data || typeof data !== 'object') {
      return data;
    }
    for (const key of Object.keys(data)) {
      const value = data[key];
      if (value && typeof value === 'object' && 'value' in value && 'seconds' in value) {
        data[key] = {
          toDate() {
            return new Date(value.value);
          }
        };
      }
    }
    return data;
  }

  function normalizeDoc(doc) {
    return {
      id: doc.id,
      exists: doc.exists,
      data() {
        return normalizeTimestampFields(doc.data);
      }
    };
  }

  function normalizeSnapshot(snapshot) {
    const docs = (snapshot.docs || []).map(normalizeDoc);
    return {
      docs,
      forEach(callback) {
        docs.forEach(callback);
      },
      empty: docs.length === 0
    };
  }

  function notifyAuthListeners(user) {
    authListeners.forEach(callback => callback(user));
  }

  function setCurrentUser(user) {
    currentUser = user ? { ...user, uid: user.uid } : null;
    authInstance.currentUser = currentUser;
    notifyAuthListeners(currentUser);
  }

  async function fetchSession() {
    try {
      const response = await apiFetch('session.php', {}, 'GET');
      if (response.authenticated) {
        setCurrentUser(response.user);
      } else {
        setCurrentUser(null);
      }
      return currentUser;
    } catch (error) {
      setCurrentUser(null);
      return null;
    }
  }

  function createUserObject(user) {
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      updateProfile(profile) {
        return apiFetch('user.php', { action: 'updateProfile', displayName: profile.displayName }, 'POST').then(response => {
          setCurrentUser({ ...currentUser, displayName: profile.displayName });
          return response;
        });
      },
      reauthenticateWithCredential(credential) {
        return apiFetch('user.php', { action: 'reauthenticate', credential }, 'POST');
      }
    };
  }

  const authInstance = {
    currentUser: null,
    onAuthStateChanged(callback) {
      authListeners.push(callback);
      if (currentUser !== null) {
        callback(currentUser);
        return;
      }
      fetchSession().then(() => callback(currentUser));
    },
    signInWithEmailAndPassword(email, password) {
      return apiFetch('login.php', { email, password }, 'POST').then(response => {
        setCurrentUser(response.user);
        return { user: createUserObject(response.user) };
      });
    },
    createUserWithEmailAndPassword(email, password) {
      return apiFetch('register.php', { email, password, displayName: email.split('@')[0] }, 'POST').then(response => {
        setCurrentUser(response.user);
        return { user: createUserObject(response.user) };
      });
    },
    signOut() {
      return apiFetch('logout.php', {}, 'POST').then(response => {
        setCurrentUser(null);
        return response;
      });
    }
  };

  function auth() {
    return authInstance;
  }

  auth.EmailAuthProvider = {
    credential(email, password) {
      return { email, password };
    }
  };

  function buildPath(parts) {
    return parts.filter(Boolean).join('/');
  }

  function FirestoreRef(path = '') {
    this.path = path;
    this.query = [];
    this.orderByClause = null;
    this.limitValue = null;
    this.isDoc = false;
  }

  FirestoreRef.prototype.collection = function(name) {
    return new FirestoreRef(buildPath([this.path, name]));
  };

  FirestoreRef.prototype.doc = function(id) {
    const ref = new FirestoreRef(buildPath([this.path, id]));
    ref.isDoc = true;
    return ref;
  };

  FirestoreRef.prototype.where = function(field, op, value) {
    this.query.push({ field, op, value });
    return this;
  };

  FirestoreRef.prototype.orderBy = function(field, direction = 'asc') {
    this.orderByClause = { field, direction };
    return this;
  };

  FirestoreRef.prototype.limit = function(count) {
    this.limitValue = count;
    return this;
  };

  FirestoreRef.prototype.get = function() {
    return apiFetch('firestore.php', {
      action: 'get',
      path: this.path,
      query: this.query,
      orderBy: this.orderByClause,
      limit: this.limitValue
    }, 'POST').then(normalizeSnapshot);
  };

  FirestoreRef.prototype.add = function(data) {
    return apiFetch('firestore.php', {
      action: 'add',
      path: this.path,
      data
    }, 'POST');
  };

  FirestoreRef.prototype.set = function(data) {
    return apiFetch('firestore.php', {
      action: 'set',
      path: this.path,
      data
    }, 'POST');
  };

  FirestoreRef.prototype.update = function(data) {
    return apiFetch('firestore.php', {
      action: 'update',
      path: this.path,
      data
    }, 'POST');
  };

  FirestoreRef.prototype.delete = function() {
    return apiFetch('firestore.php', {
      action: 'delete',
      path: this.path
    }, 'POST');
  };

  function firestore() {
    return new FirestoreRef();
  }

  firestore.FieldValue = {
    serverTimestamp() {
      return { __serverTimestamp: true };
    }
  };

  window.firebase = {
    auth,
    firestore
  };

  document.addEventListener('DOMContentLoaded', function() {
    const userMenu = document.getElementById('userMenu');
    if (!userMenu) return;
    userMenu.addEventListener('click', function() {
      const base = window.location.pathname.includes('/pages/') ? '' : 'pages/';
      const target = currentUser ? base + 'profile.html' : base + 'login.html';
      window.location.href = target;
    });
  });
})();
