// Client-side local database and REST API simulator for offline/static deployment fallback
const MOCK_STORAGE_KEY = 'dc_mock_db_';

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

// Seed mock data if database is empty
function getTable(name) {
  const data = localStorage.getItem(`${MOCK_STORAGE_KEY}${name}`);
  if (data) {
    return JSON.parse(data);
  }
  return [];
}

function saveTable(name, list) {
  localStorage.setItem(`${MOCK_STORAGE_KEY}${name}`, JSON.stringify(list));
}

// Seed sandbox mock data
function seedData() {
  const loadedUsers = getTable('users');
  if (loadedUsers.length > 0) return;

  const generateId = () => Math.random().toString(36).substring(2, 11);

  // 1. Create Users
  const ankush = {
    id: generateId(),
    name: 'Ankush',
    email: 'ankush@devcollab.com',
    password: 'password123',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Ankush',
    bio: 'Senior Frontend Developer',
    skills: ['React', 'CSS Grid', 'WebSocket'],
    github: 'github.com/ankush',
    plan: 'free',
    createdAt: new Date().toISOString()
  };
  const riya = {
    id: generateId(),
    name: 'Riya',
    email: 'riya@devcollab.com',
    password: 'password123',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Riya',
    bio: 'DevOps Engineer',
    skills: ['Docker', 'Node.js', 'GitHub Actions'],
    github: 'github.com/riya',
    plan: 'free',
    createdAt: new Date().toISOString()
  };
  const siddharth = {
    id: generateId(),
    name: 'Siddharth',
    email: 'siddharth@devcollab.com',
    password: 'password123',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Siddharth',
    bio: 'AI Lead',
    skills: ['Python', 'PyTorch', 'FastAPI'],
    github: 'github.com/siddharth',
    plan: 'free',
    createdAt: new Date().toISOString()
  };

  const usersList = [ankush, riya, siddharth];
  saveTable('users', usersList);

  // 2. Create Workspace
  const sandboxWs = {
    id: generateId(),
    name: 'DevCollab Sandbox (Local)',
    ownerId: ankush.id,
    members: [
      { userId: ankush.id, role: 'Owner' },
      { userId: riya.id, role: 'Admin' },
      { userId: siddharth.id, role: 'Member' }
    ],
    invites: [],
    createdAt: new Date().toISOString()
  };
  saveTable('workspaces', [sandboxWs]);

  // 3. Create Project
  const coreProj = {
    id: generateId(),
    workspaceId: sandboxWs.id,
    name: 'Core Platform Integration',
    description: 'GitHub-meets-Notion-meets-Slack developer sandbox workspace',
    createdAt: new Date().toISOString()
  };
  saveTable('projects', [coreProj]);

  // 4. Create Pre-Populated Tasks
  const tasksList = [
    {
      id: generateId(),
      projectId: coreProj.id,
      title: 'Setup Socket.IO Rooms & Middlewares',
      description: 'Establish WebSockets room partitions inside Express app server, tracking joined and left heartbeats dynamically.',
      assigneeId: ankush.id,
      status: 'in_progress',
      priority: 'P0',
      labels: ['backend', 'realtime'],
      checklist: [],
      attachments: [],
      createdAt: new Date().toISOString()
    },
    {
      id: generateId(),
      projectId: coreProj.id,
      title: 'Design Glassmorphic User Interface',
      description: 'Construct the Obsidian dark theme stylesheet using curated CSS variables, modern Outfit typography, and subtle micro-animations.',
      assigneeId: riya.id,
      status: 'todo',
      priority: 'P1',
      labels: ['frontend', 'ui'],
      checklist: [],
      attachments: [],
      createdAt: new Date().toISOString()
    },
    {
      id: generateId(),
      projectId: coreProj.id,
      title: 'Create Notion Wiki Documentation',
      description: 'Draft hierarchical pages detailing core system architectural specifications, version rollback drawers, and local styling rules.',
      assigneeId: siddharth.id,
      status: 'done',
      priority: 'P2',
      labels: ['docs'],
      checklist: [],
      attachments: [],
      createdAt: new Date().toISOString()
    }
  ];
  saveTable('tasks', tasksList);

  // 5. Create Wiki Docs
  const docsList = [
    {
      id: generateId(),
      projectId: coreProj.id,
      title: 'Architectural Specs',
      content: '# Architectural Specifications\n\nWelcome to the local development documentation.\n\n- Backend: Express Server & WebSockets\n- Frontend: React Compiled via Vite\n- Styling: Glassmorphism Custom Dark Theme\n- DB Layer: Light JSON Database Queue',
      parentId: null,
      history: [
        {
          id: generateId(),
          content: '# Architectural Specifications\n\nInitial draft.',
          editedBy: 'Ankush',
          timestamp: new Date().toISOString()
        }
      ],
      createdAt: new Date().toISOString()
    }
  ];
  saveTable('docs', docsList);

  // 6. Create Code Snippet
  const snippetsList = [
    {
      id: generateId(),
      projectId: coreProj.id,
      title: 'JSON DB Queue Handler',
      code: 'function queueSave(tableName) {\n  if (writeQueue[tableName]) {\n    clearTimeout(writeQueue[tableName]);\n  }\n  writeQueue[tableName] = setTimeout(() => {\n    saveTableSync(tableName);\n  }, 100);\n}',
      language: 'javascript',
      tags: ['database', 'async'],
      createdBy: ankush.id,
      creatorName: 'Ankush',
      aiReview: 'Rating: 9/10.\nDynamic queuing prevents atomic file write errors perfectly.',
      createdAt: new Date().toISOString()
    }
  ];
  saveTable('snippets', snippetsList);

  // 7. Create Activities
  const activitiesList = [
    {
      id: generateId(),
      workspaceId: sandboxWs.id,
      projectId: coreProj.id,
      userId: ankush.id,
      userName: 'Ankush',
      actionType: 'member_joined',
      details: 'Local Sandbox initialized successfully. Client Sandbox mode loaded.',
      createdAt: new Date().toISOString()
    }
  ];
  saveTable('activities', activitiesList);
}

// Perform seeding
seedData();

// REST API Simulator
export async function simulateFetch(url, options = {}) {
  const method = options.method || 'GET';
  const body = options.body ? JSON.parse(options.body) : null;
  const generateId = () => Math.random().toString(36).substring(2, 11);

  // Parse path
  let path = url;
  if (url.startsWith('http')) {
    const urlObj = new URL(url);
    path = urlObj.pathname;
  }

  // Helper response builder
  const response = (status, data) => {
    return {
      ok: status >= 200 && status < 300,
      status,
      statusText: status === 200 ? 'OK' : 'Error',
      json: async () => data,
      text: async () => JSON.stringify(data),
      headers: new Headers({ 'Content-Type': 'application/json' })
    };
  };

  try {
    // 1. AUTH API
    if (path === '/api/auth/register') {
      const users = getTable('users');
      const { name, email, password, bio, skills, github } = body;
      
      if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        return response(400, { error: 'User with this email already exists.' });
      }

      const newUser = {
        id: generateId(),
        name,
        email: email.toLowerCase(),
        password,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
        bio: bio || '',
        skills: skills || [],
        github: github || '',
        plan: 'free',
        createdAt: new Date().toISOString()
      };
      
      users.push(newUser);
      saveTable('users', users);

      // Add to sandbox workspace
      const workspaces = getTable('workspaces');
      const sandboxWs = workspaces.find(w => w.name.includes('DevCollab Sandbox'));
      if (sandboxWs) {
        sandboxWs.members.push({ userId: newUser.id, role: 'Member' });
        saveTable('workspaces', workspaces);

        // Log activity
        const activities = getTable('activities');
        activities.push({
          id: generateId(),
          workspaceId: sandboxWs.id,
          userId: newUser.id,
          userName: newUser.name,
          actionType: 'member_joined',
          details: `${newUser.name} registered and joined the Local Sandbox.`,
          createdAt: new Date().toISOString()
        });
        saveTable('activities', activities);
      }

      return response(200, { success: true, user: newUser });
    }

    if (path === '/api/auth/login') {
      const users = getTable('users');
      const { email, password } = body;
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
      
      if (!user) {
        return response(401, { error: 'Invalid email or password.' });
      }
      return response(200, { success: true, user, token: 'mock-local-token' });
    }

    if (path.startsWith('/api/auth/verify/')) {
      const userId = path.split('/').pop();
      const users = getTable('users');
      const user = users.find(u => u.id === userId);
      if (!user) {
        return response(404, { error: 'User does not exist in local database.' });
      }
      return response(200, user);
    }

    if (path === '/api/users') {
      const users = getTable('users');
      return response(200, users);
    }

    // 2. WORKSPACE API
    if (path.startsWith('/api/workspaces')) {
      const workspaces = getTable('workspaces');

      // GET /api/workspaces?userId=...
      if (method === 'GET') {
        const queryParams = new URL(url, 'http://localhost').searchParams;
        const userId = queryParams.get('userId');
        
        if (path.endsWith('/projects')) {
          // GET /api/workspaces/:wsId/projects
          const wsId = path.split('/')[3];
          const projects = getTable('projects');
          const filteredProjects = projects.filter(p => p.workspaceId === wsId);
          return response(200, filteredProjects);
        }

        if (path.endsWith('/activities')) {
          // GET /api/workspaces/:wsId/activities
          const wsId = path.split('/')[3];
          const activities = getTable('activities');
          const filteredActivities = activities.filter(a => a.workspaceId === wsId);
          return response(200, filteredActivities);
        }

        const filteredWorkspaces = workspaces.filter(w => w.members.some(m => m.userId === userId));
        return response(200, filteredWorkspaces);
      }

      // POST /api/workspaces
      if (method === 'POST') {
        if (path.endsWith('/invite')) {
          // POST /api/workspaces/:wsId/invite
          const wsId = path.split('/')[3];
          const { email, role } = body;
          const users = getTable('users');
          const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
          
          const ws = workspaces.find(w => w.id === wsId);
          if (!ws) return response(404, { error: 'Workspace not found.' });

          if (!user) {
            ws.invites = ws.invites || [];
            if (!ws.invites.includes(email.toLowerCase())) {
              ws.invites.push(email.toLowerCase());
              saveTable('workspaces', workspaces);
            }
            return response(200, { success: true, invited: true, email });
          }

          if (!ws.members.some(m => m.userId === user.id)) {
            ws.members.push({ userId: user.id, role: role || 'Member' });
            saveTable('workspaces', workspaces);

            // Log activity
            const activities = getTable('activities');
            activities.push({
              id: generateId(),
              workspaceId: wsId,
              userId: user.id,
              userName: user.name,
              actionType: 'member_joined',
              details: `${user.name} was added to the workspace.`,
              createdAt: new Date().toISOString()
            });
            saveTable('activities', activities);
          }
          return response(200, { success: true, user });
        }

        if (path.endsWith('/join')) {
          // POST /api/workspaces/:wsId/join
          const wsId = path.split('/')[3];
          const { userId } = body;
          const ws = workspaces.find(w => w.id === wsId);
          const users = getTable('users');
          const user = users.find(u => u.id === userId);

          if (!ws || !user) return response(404, { error: 'Invalid parameters.' });

          if (!ws.members.some(m => m.userId === user.id)) {
            ws.members.push({ userId: user.id, role: 'Member' });
            saveTable('workspaces', workspaces);
          }
          return response(200, { success: true });
        }

        // Standard Workspace creation
        const { name, ownerId } = body;
        const newWs = {
          id: generateId(),
          name,
          ownerId,
          members: [{ userId: ownerId, role: 'Owner' }],
          invites: [],
          createdAt: new Date().toISOString()
        };
        workspaces.push(newWs);
        saveTable('workspaces', workspaces);
        return response(200, newWs);
      }
    }

    // 3. PROJECTS API
    if (path.startsWith('/api/projects')) {
      const projects = getTable('projects');

      if (method === 'GET') {
        const projectId = path.split('/')[3];
        if (path.endsWith('/tasks')) {
          const tasks = getTable('tasks');
          return response(200, tasks.filter(t => t.projectId === projectId));
        }
        if (path.endsWith('/docs')) {
          const docs = getTable('docs');
          return response(200, docs.filter(d => d.projectId === projectId));
        }
        if (path.endsWith('/snippets')) {
          const snippets = getTable('snippets');
          return response(200, snippets.filter(s => s.projectId === projectId));
        }
      }

      if (method === 'POST') {
        const { workspaceId, name, description } = body;
        const newProj = {
          id: generateId(),
          workspaceId,
          name,
          description: description || '',
          createdAt: new Date().toISOString()
        };
        projects.push(newProj);
        saveTable('projects', projects);
        return response(200, newProj);
      }
    }

    // 4. TASKS API
    if (path.startsWith('/api/tasks')) {
      const tasks = getTable('tasks');

      if (method === 'GET') {
        if (path.endsWith('/comments')) {
          // GET /api/tasks/:taskId/comments
          const taskId = path.split('/')[3];
          const comments = getTable('comments');
          return response(200, comments.filter(c => c.taskId === taskId));
        }
        return response(200, tasks);
      }

      if (method === 'POST') {
        const { projectId, title, description, assigneeId, status, priority, labels, dueDate, checklist, attachments } = body;
        const newTask = {
          id: generateId(),
          projectId,
          title,
          description: description || '',
          assigneeId: assigneeId || null,
          status: status || 'todo',
          priority: priority || 'P1',
          labels: labels || [],
          dueDate: dueDate || null,
          checklist: checklist || [],
          attachments: attachments || [],
          createdAt: new Date().toISOString()
        };
        tasks.push(newTask);
        saveTable('tasks', tasks);
        return response(200, newTask);
      }

      if (method === 'PUT') {
        const taskId = path.split('/').pop();
        const index = tasks.findIndex(t => t.id === taskId);
        if (index === -1) return response(404, { error: 'Task not found.' });

        tasks[index] = { ...tasks[index], ...body };
        saveTable('tasks', tasks);
        return response(200, tasks[index]);
      }
    }

    // 5. COMMENTS API
    if (path === '/api/comments') {
      const comments = getTable('comments');
      const { taskId, userId, userName, userAvatar, content } = body;
      const newComment = {
        id: generateId(),
        taskId,
        userId,
        userName,
        userAvatar: userAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(userName)}`,
        content,
        createdAt: new Date().toISOString()
      };
      comments.push(newComment);
      saveTable('comments', comments);

      // Check for @mentions and trigger notifications in localStorage
      const users = getTable('users');
      const matches = content.match(/@(\w+)/g);
      if (matches) {
        const notifications = getTable('notifications');
        matches.forEach(m => {
          const mName = m.substring(1);
          const mentionedUser = users.find(u => u.name.toLowerCase() === mName.toLowerCase());
          if (mentionedUser) {
            notifications.push({
              id: generateId(),
              userId: mentionedUser.id,
              type: 'mention',
              title: `Mentioned in ${userName}'s comment`,
              message: content,
              read: false,
              createdAt: new Date().toISOString()
            });
          }
        });
        saveTable('notifications', notifications);
      }

      return response(200, newComment);
    }

    // 6. DOCUMENTS WIKI API
    if (path.startsWith('/api/docs')) {
      const docs = getTable('docs');

      if (method === 'POST') {
        const { projectId, title, content, parentId } = body;
        const newDoc = {
          id: generateId(),
          projectId,
          title,
          content: content || '',
          parentId: parentId || null,
          history: [{
            id: generateId(),
            content: content || '',
            editedBy: 'Local Developer',
            timestamp: new Date().toISOString()
          }],
          createdAt: new Date().toISOString()
        };
        docs.push(newDoc);
        saveTable('docs', docs);
        return response(200, newDoc);
      }

      if (method === 'PUT') {
        const docId = path.split('/').pop();
        const index = docs.findIndex(d => d.id === docId);
        if (index === -1) return response(404, { error: 'Document not found.' });

        const doc = docs[index];
        const newContent = body.content !== undefined ? body.content : doc.content;
        const newTitle = body.title !== undefined ? body.title : doc.title;

        // Push history if content changed
        const history = doc.history || [];
        if (body.content !== undefined && body.content !== doc.content) {
          history.push({
            id: generateId(),
            content: newContent,
            editedBy: 'Local Developer',
            timestamp: new Date().toISOString()
          });
        }

        docs[index] = {
          ...doc,
          title: newTitle,
          content: newContent,
          history
        };
        saveTable('docs', docs);
        return response(200, docs[index]);
      }

      if (path.endsWith('/rollback')) {
        const docId = path.split('/')[3];
        const { historyId } = body;
        const index = docs.findIndex(d => d.id === docId);
        if (index === -1) return response(404, { error: 'Document not found.' });

        const doc = docs[index];
        const histItem = doc.history.find(h => h.id === historyId);
        if (!histItem) return response(404, { error: 'History revision not found.' });

        doc.content = histItem.content;
        doc.history.push({
          id: generateId(),
          content: histItem.content,
          editedBy: 'Rollback (Local)',
          timestamp: new Date().toISOString()
        });

        saveTable('docs', docs);
        return response(200, doc);
      }
    }

    // 7. SNIPPETS API
    if (path.startsWith('/api/snippets')) {
      const snippets = getTable('snippets');

      if (method === 'POST') {
        const { projectId, title, code, language, tags, createdBy, creatorName } = body;
        const newSnippet = {
          id: generateId(),
          projectId,
          title,
          code,
          language,
          tags: tags || [],
          createdBy,
          creatorName: creatorName || 'Developer',
          aiReview: null,
          createdAt: new Date().toISOString()
        };
        snippets.push(newSnippet);
        saveTable('snippets', snippets);
        return response(200, newSnippet);
      }

      if (method === 'DELETE') {
        const snipId = path.split('/').pop();
        const filtered = snippets.filter(s => s.id !== snipId);
        saveTable('snippets', filtered);
        return response(200, { success: true });
      }
    }

    // 8. NOTIFICATIONS API
    if (path.startsWith('/api/notifications')) {
      const notifications = getTable('notifications');

      if (path.endsWith('/read-all')) {
        const { userId } = body;
        const list = notifications.map(n => n.userId === userId ? { ...n, read: true } : n);
        saveTable('notifications', list);
        return response(200, { success: true });
      }

      if (path.endsWith('/read')) {
        const id = path.split('/')[3];
        const list = notifications.map(n => n.id === id ? { ...n, read: true } : n);
        saveTable('notifications', list);
        return response(200, { success: true });
      }

      // GET /api/users/:id/notifications
      const userId = path.split('/')[3];
      return response(200, notifications.filter(n => n.userId === userId));
    }

    // 9. PAYMENTS API
    if (path === '/api/payments/checkout') {
      const { userId, workspaceId } = body;
      const users = getTable('users');
      const idx = users.findIndex(u => u.id === userId);
      if (idx !== -1) {
        users[idx].plan = 'pro';
        saveTable('users', users);
      }

      const activities = getTable('activities');
      activities.push({
        id: generateId(),
        workspaceId,
        userId,
        userName: users[idx]?.name || 'Developer',
        actionType: 'member_joined',
        details: 'Workspace upgraded to Pro tier. Sandbox Checkout successfully authorized locally.',
        createdAt: new Date().toISOString()
      });
      saveTable('activities', activities);

      const notifications = getTable('notifications');
      notifications.push({
        id: generateId(),
        userId,
        type: 'system',
        title: 'Workspace Upgraded to Pro',
        message: 'Sandbox transaction complete! Premium unlimited limits and AI features unlocked locally!',
        read: false,
        createdAt: new Date().toISOString()
      });
      saveTable('notifications', notifications);

      return response(200, { success: true, user: users[idx] });
    }

    // 10. AI API
    if (path === '/api/ai/review') {
      const { code, language } = body;
      let review = `Rating: 8/10.\nYour ${language} snippet conforms to standard modular programming paradigms. Highly readable logic with clear data pathways.`;
      if (code.includes('var ')) {
        review = `Rating: 6/10.\nAnti-Pattern Detected: Avoid using 'var' inside scope functions. Upgrade scope declarations to ES6 'let' or 'const' keywords to avoid variable hoisting leakage.`;
      } else if (code.includes('eval(')) {
        review = `Rating: 3/10.\nSecurity Vulnerability Detected: Injection Vector. Using 'eval()' exposes variable evaluations directly to input injections. Refactor immediately using safe dynamic parsing wrappers.`;
      }
      return response(200, { success: true, review });
    }

    if (path === '/api/ai/breakdown') {
      const { prompt } = body;
      const mockTasks = [
        { title: `Initialize architectural templates for: ${prompt}`, priority: 'P0', labels: ['setup'] },
        { title: `Design database entities and mock JSON layers`, priority: 'P1', labels: ['backend'] },
        { title: `Integrate styling rules and Outfit CSS fonts`, priority: 'P1', labels: ['frontend', 'ui'] },
        { title: `Establish client state contexts and state providers`, priority: 'P1', labels: ['frontend'] },
        { title: `Conduct double-client room tests and socket handshakes`, priority: 'P2', labels: ['realtime'] },
        { title: `Conduct production bundle packaging checks`, priority: 'P2', labels: ['deployment'] }
      ];
      return response(200, { success: true, tasks: mockTasks });
    }

    if (path.startsWith('/api/ai/')) {
      const action = path.split('/').pop();
      let responseText = '';
      if (action === 'summarize') {
        responseText = 'Current Status: Task workflow distribution shows a balanced sprint queue. Focus remains on Setup Sockets (In Progress) and Glassmorphic Styling (To Do) to complete milestones.';
      } else if (action === 'blockers') {
        responseText = 'Blocker Analysis: Setup Socket.IO Rooms (In Progress) has had no state mutations for 18h. Recommendation: Check if address binding port 5050 is occupied by legacy node scripts on host system.';
      } else if (action === 'standup') {
        responseText = 'Standup Report:\n- Yesterday: Created database JSON transactions and pre-seeded team entities.\n- Today: Aligning task Kanban card layouts and presence notifications.\n- Blockers: None identified.';
      }
      return response(200, { success: true, response: responseText });
    }

    // Default Fallback
    return response(404, { error: 'Mock endpoint not found.' });

  } catch (err) {
    console.error('Error in mock API simulator', err);
    return response(500, { error: 'Internal simulator error.' });
  }
}
