import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-Memory tables
const tables = {
  users: [],
  workspaces: [],
  projects: [],
  tasks: [],
  docs: [],
  snippets: [],
  comments: [],
  activities: [],
  notifications: []
};

// Queue systems to prevent write collisions
const writeQueue = {};

function loadTable(tableName) {
  const filePath = path.join(DATA_DIR, `${tableName}.json`);
  if (fs.existsSync(filePath)) {
    try {
      const data = fs.readFileSync(filePath, 'utf-8');
      tables[tableName] = JSON.parse(data);
    } catch (e) {
      console.error(`Error loading table ${tableName}, resetting...`, e);
      tables[tableName] = [];
    }
  } else {
    tables[tableName] = [];
    saveTableSync(tableName);
  }
}

function saveTableSync(tableName) {
  const filePath = path.join(DATA_DIR, `${tableName}.json`);
  fs.writeFileSync(filePath, JSON.stringify(tables[tableName], null, 2), 'utf-8');
}

function queueSave(tableName) {
  if (writeQueue[tableName]) {
    clearTimeout(writeQueue[tableName]);
  }
  writeQueue[tableName] = setTimeout(() => {
    try {
      saveTableSync(tableName);
    } catch (e) {
      console.error(`Error writing table ${tableName} asynchronously`, e);
    }
    delete writeQueue[tableName];
  }, 100);
}

// Initialize tables
Object.keys(tables).forEach(loadTable);

// Helper ID generator
function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

// ==========================================
// USER OPERATIONS
// ==========================================
export const users = {
  create: (userData) => {
    const newUser = {
      id: generateId(),
      name: userData.name,
      email: userData.email.toLowerCase(),
      password: userData.password, // Simple for mock authentication
      avatar: userData.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(userData.name)}`,
      bio: userData.bio || '',
      skills: userData.skills || [],
      github: userData.github || '',
      plan: 'free', // 'free' | 'pro'
      createdAt: new Date().toISOString()
    };
    tables.users.push(newUser);
    queueSave('users');
    return newUser;
  },
  findByEmail: (email) => {
    return tables.users.find(u => u.email === email.toLowerCase());
  },
  findById: (id) => {
    return tables.users.find(u => u.id === id);
  },
  update: (id, updates) => {
    const userIndex = tables.users.findIndex(u => u.id === id);
    if (userIndex === -1) return null;
    tables.users[userIndex] = { ...tables.users[userIndex], ...updates };
    queueSave('users');
    return tables.users[userIndex];
  },
  list: () => tables.users
};

// ==========================================
// WORKSPACE OPERATIONS
// ==========================================
export const workspaces = {
  create: (workspaceData) => {
    const newWorkspace = {
      id: generateId(),
      name: workspaceData.name,
      ownerId: workspaceData.ownerId,
      members: [
        { userId: workspaceData.ownerId, role: 'Owner' }
      ],
      invites: [], // array of email strings
      createdAt: new Date().toISOString()
    };
    tables.workspaces.push(newWorkspace);
    queueSave('workspaces');
    return newWorkspace;
  },
  findById: (id) => {
    return tables.workspaces.find(w => w.id === id);
  },
  listByUser: (userId) => {
    return tables.workspaces.filter(w => 
      w.members.some(m => m.userId === userId)
    );
  },
  update: (id, updates) => {
    const index = tables.workspaces.findIndex(w => w.id === id);
    if (index === -1) return null;
    tables.workspaces[index] = { ...tables.workspaces[index], ...updates };
    queueSave('workspaces');
    return tables.workspaces[index];
  },
  addMember: (id, email, role = 'Member') => {
    const workspace = tables.workspaces.find(w => w.id === id);
    if (!workspace) return null;
    const user = tables.users.find(u => u.email === email.toLowerCase());
    if (!user) return null;
    
    // Check if already in workspace
    if (workspace.members.some(m => m.userId === user.id)) {
      return workspace;
    }

    workspace.members.push({ userId: user.id, role });
    // Remove from invites if present
    workspace.invites = workspace.invites.filter(inv => inv.toLowerCase() !== email.toLowerCase());
    queueSave('workspaces');
    return workspace;
  },
  addInvite: (id, email) => {
    const workspace = tables.workspaces.find(w => w.id === id);
    if (!workspace) return null;
    const formattedEmail = email.toLowerCase();
    if (!workspace.invites.includes(formattedEmail)) {
      workspace.invites.push(formattedEmail);
      queueSave('workspaces');
    }
    return workspace;
  },
  list: () => tables.workspaces
};

// ==========================================
// PROJECT OPERATIONS
// ==========================================
export const projects = {
  create: (projectData) => {
    const newProject = {
      id: generateId(),
      workspaceId: projectData.workspaceId,
      name: projectData.name,
      description: projectData.description || '',
      createdAt: new Date().toISOString()
    };
    tables.projects.push(newProject);
    queueSave('projects');
    return newProject;
  },
  findById: (id) => {
    return tables.projects.find(p => p.id === id);
  },
  listByWorkspace: (workspaceId) => {
    return tables.projects.filter(p => p.workspaceId === workspaceId);
  },
  list: () => tables.projects
};

// ==========================================
// TASK OPERATIONS
// ==========================================
export const tasks = {
  create: (taskData) => {
    const newTask = {
      id: generateId(),
      projectId: taskData.projectId,
      title: taskData.title,
      description: taskData.description || '',
      assigneeId: taskData.assigneeId || null,
      status: taskData.status || 'todo', // 'todo' | 'in_progress' | 'in_review' | 'done'
      priority: taskData.priority || 'P1', // 'P0' | 'P1' | 'P2'
      dueDate: taskData.dueDate || '',
      labels: taskData.labels || [],
      attachments: taskData.attachments || [], // array of { id, name, url }
      checklist: taskData.checklist || [], // array of { id, text, completed }
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    tables.tasks.push(newTask);
    queueSave('tasks');
    return newTask;
  },
  findById: (id) => {
    return tables.tasks.find(t => t.id === id);
  },
  listByProject: (projectId) => {
    return tables.tasks.filter(t => t.projectId === projectId);
  },
  update: (id, updates) => {
    const index = tables.tasks.findIndex(t => t.id === id);
    if (index === -1) return null;
    tables.tasks[index] = { 
      ...tables.tasks[index], 
      ...updates, 
      updatedAt: new Date().toISOString() 
    };
    queueSave('tasks');
    return tables.tasks[index];
  },
  delete: (id) => {
    const index = tables.tasks.findIndex(t => t.id === id);
    if (index === -1) return false;
    tables.tasks.splice(index, 1);
    queueSave('tasks');
    return true;
  }
};

// ==========================================
// DOCUMENT/WIKI OPERATIONS
// ==========================================
export const docs = {
  create: (docData) => {
    const newDoc = {
      id: generateId(),
      projectId: docData.projectId,
      title: docData.title,
      content: docData.content || '',
      parentDocId: docData.parentDocId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      versions: [
        {
          versionId: generateId(),
          title: docData.title,
          content: docData.content || '',
          updatedAt: new Date().toISOString(),
          updatedBy: docData.userId || 'System'
        }
      ]
    };
    tables.docs.push(newDoc);
    queueSave('docs');
    return newDoc;
  },
  findById: (id) => {
    return tables.docs.find(d => d.id === id);
  },
  listByProject: (projectId) => {
    return tables.docs.filter(d => d.projectId === projectId);
  },
  update: (id, updates, userId) => {
    const index = tables.docs.findIndex(d => d.id === id);
    if (index === -1) return null;
    const doc = tables.docs[index];
    
    const updatedDoc = {
      ...doc,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    // Save version if title or content changed
    if (updates.title !== undefined || updates.content !== undefined) {
      updatedDoc.versions = [
        ...doc.versions,
        {
          versionId: generateId(),
          title: updates.title !== undefined ? updates.title : doc.title,
          content: updates.content !== undefined ? updates.content : doc.content,
          updatedAt: new Date().toISOString(),
          updatedBy: userId || 'System'
        }
      ];
    }

    tables.docs[index] = updatedDoc;
    queueSave('docs');
    return updatedDoc;
  },
  rollbackVersion: (id, versionId) => {
    const index = tables.docs.findIndex(d => d.id === id);
    if (index === -1) return null;
    const doc = tables.docs[index];
    const version = doc.versions.find(v => v.versionId === versionId);
    if (!version) return null;

    doc.title = version.title;
    doc.content = version.content;
    doc.updatedAt = new Date().toISOString();
    
    // Add rollback record into versions array
    doc.versions.push({
      versionId: generateId(),
      title: version.title,
      content: version.content,
      updatedAt: new Date().toISOString(),
      updatedBy: 'Rollback System'
    });

    queueSave('docs');
    return doc;
  },
  delete: (id) => {
    const index = tables.docs.findIndex(d => d.id === id);
    if (index === -1) return false;
    // Detach children
    tables.docs.forEach(child => {
      if (child.parentDocId === id) {
        child.parentDocId = null;
      }
    });
    tables.docs.splice(index, 1);
    queueSave('docs');
    return true;
  }
};

// ==========================================
// CODE SNIPPET OPERATIONS
// ==========================================
export const snippets = {
  create: (snippetData) => {
    const newSnippet = {
      id: generateId(),
      projectId: snippetData.projectId,
      title: snippetData.title,
      language: snippetData.language || 'javascript',
      code: snippetData.code || '',
      tags: snippetData.tags || [],
      description: snippetData.description || '',
      createdAt: new Date().toISOString()
    };
    tables.snippets.push(newSnippet);
    queueSave('snippets');
    return newSnippet;
  },
  findById: (id) => {
    return tables.snippets.find(s => s.id === id);
  },
  listByProject: (projectId) => {
    return tables.snippets.filter(s => s.projectId === projectId);
  },
  delete: (id) => {
    const index = tables.snippets.findIndex(s => s.id === id);
    if (index === -1) return false;
    tables.snippets.splice(index, 1);
    queueSave('snippets');
    return true;
  }
};

// ==========================================
// COMMENT OPERATIONS
// ==========================================
export const comments = {
  create: (commentData) => {
    const newComment = {
      id: generateId(),
      taskId: commentData.taskId,
      userId: commentData.userId,
      userName: commentData.userName,
      userAvatar: commentData.userAvatar,
      content: commentData.content,
      createdAt: new Date().toISOString()
    };
    tables.comments.push(newComment);
    queueSave('comments');
    return newComment;
  },
  listByTask: (taskId) => {
    return tables.comments.filter(c => c.taskId === taskId)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }
};

// ==========================================
// ACTIVITY FEED OPERATIONS
// ==========================================
export const activities = {
  create: (activityData) => {
    const newActivity = {
      id: generateId(),
      workspaceId: activityData.workspaceId,
      projectId: activityData.projectId || null,
      userId: activityData.userId,
      userName: activityData.userName,
      actionType: activityData.actionType, // 'task_created', 'task_moved', 'comment_added', 'doc_updated', 'member_joined'
      details: activityData.details || '',
      createdAt: new Date().toISOString()
    };
    tables.activities.push(newActivity);
    queueSave('activities');
    return newActivity;
  },
  listByWorkspace: (workspaceId) => {
    return tables.activities.filter(a => a.workspaceId === workspaceId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
};

// ==========================================
// NOTIFICATION OPERATIONS
// ==========================================
export const notifications = {
  create: (notifyData) => {
    const newNotify = {
      id: generateId(),
      userId: notifyData.userId,
      type: notifyData.type || 'mention', // 'mention' | 'assignment' | 'system'
      title: notifyData.title,
      message: notifyData.message,
      read: false,
      createdAt: new Date().toISOString()
    };
    tables.notifications.push(newNotify);
    queueSave('notifications');
    return newNotify;
  },
  listByUser: (userId) => {
    return tables.notifications.filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  markRead: (id) => {
    const index = tables.notifications.findIndex(n => n.id === id);
    if (index === -1) return null;
    tables.notifications[index].read = true;
    queueSave('notifications');
    return tables.notifications[index];
  },
  markAllRead: (userId) => {
    tables.notifications.forEach(n => {
      if (n.userId === userId) {
        n.read = true;
      }
    });
    queueSave('notifications');
    return true;
  }
};
