import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { 
  users, 
  workspaces, 
  projects, 
  tasks, 
  docs, 
  snippets, 
  comments, 
  activities, 
  notifications 
} from './db.js';
import { aiService } from './aiService.js';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

const PORT = process.env.PORT || 5050;

// Seed standard mock users, shared workspace, projects, tasks, wiki pages, and code snippets
if (users.list().length === 0) {
  // 1. Create Mock Users
  const ankush = users.create({ name: 'Ankush', email: 'ankush@devcollab.com', password: 'password123', bio: 'Senior Frontend Developer', skills: ['React', 'CSS Grid', 'WebSocket'], github: 'github.com/ankush' });
  const riya = users.create({ name: 'Riya', email: 'riya@devcollab.com', password: 'password123', bio: 'DevOps Engineer', skills: ['Docker', 'Node.js', 'GitHub Actions'], github: 'github.com/riya' });
  const siddharth = users.create({ name: 'Siddharth', email: 'siddharth@devcollab.com', password: 'password123', bio: 'AI Lead', skills: ['Python', 'PyTorch', 'FastAPI'], github: 'github.com/siddharth' });

  // 2. Create Shared Workspace
  const sandboxWs = workspaces.create({ name: 'DevCollab Sandbox', ownerId: ankush.id });
  
  // Add other team members to shared workspace
  workspaces.addMember(sandboxWs.id, riya.email, 'Admin');
  workspaces.addMember(sandboxWs.id, siddharth.email, 'Member');

  // 3. Create Shared Project
  const coreProj = projects.create({ workspaceId: sandboxWs.id, name: 'Core Platform Integration', description: 'GitHub-meets-Notion-meets-Slack developer sandbox workspace' });

  // 4. Create Pre-Populated Kanban Tasks
  tasks.create({
    projectId: coreProj.id,
    title: 'Setup Socket.IO Rooms & Middlewares',
    description: 'Establish WebSockets room partitions inside Express app server, tracking joined and left heartbeats dynamically.',
    assigneeId: ankush.id,
    status: 'in_progress',
    priority: 'P0',
    labels: ['backend', 'realtime']
  });

  tasks.create({
    projectId: coreProj.id,
    title: 'Design Glassmorphic User Interface',
    description: 'Construct the Obsidian dark theme stylesheet using curated CSS variables, modern Outfit typography, and subtle micro-animations.',
    assigneeId: riya.id,
    status: 'todo',
    priority: 'P1',
    labels: ['frontend', 'ui']
  });

  tasks.create({
    projectId: coreProj.id,
    title: 'Create Notion Wiki Documentation',
    description: 'Draft hierarchical pages detailing core system architectural specifications, version rollback drawers, and local styling rules.',
    assigneeId: siddharth.id,
    status: 'done',
    priority: 'P2',
    labels: ['docs']
  });

  tasks.create({
    projectId: coreProj.id,
    title: 'Implement Sandbox Checkout Gates',
    description: 'Establish secure mock checkout interfaces displaying numerical form validators and upgrading workspace licenses to Pro on success.',
    assigneeId: ankush.id,
    status: 'in_review',
    priority: 'P1',
    labels: ['payments']
  });

  tasks.create({
    projectId: coreProj.id,
    title: 'Draft Daily Standup Formats',
    description: 'Write local rule-based heuristics that format recent user activity feeds into standard developer standups.',
    assigneeId: siddharth.id,
    status: 'todo',
    priority: 'P2',
    labels: ['ai']
  });

  tasks.create({
    projectId: coreProj.id,
    title: 'Write Multi-Client Integration Tests',
    description: 'Establish simulator test beds verifying socket broadcasts glide board items seamlessly side-by-side.',
    assigneeId: null,
    status: 'todo',
    priority: 'P1',
    labels: ['testing']
  });

  // 5. Create Mock Wiki docs
  docs.create({
    projectId: coreProj.id,
    title: 'Architecture Overview',
    content: '# System Architecture Overview\n\nWelcome to our Notion Wiki page! This project utilizes a single-repo design:\n- **Backend**: Node.js Express server alongside Socket.io for live collaboration rooms.\n- **Frontend**: Single Page Application styled with Vanilla CSS.\n\nLink other wiki pages in this section to navigate between modules!',
    userId: 'Ankush'
  });

  docs.create({
    projectId: coreProj.id,
    title: 'Client CSS Guidelines',
    content: '# Client Custom CSS Guidelines\n\nTo maintain visual harmony, we rely on custom CSS variables inside `index.css`:\n- Background: Deep obsidian Obsidian (#0a0b0e)\n- Highlights: Purple (#8b5cf6) & Pink (#d946ef)\n\nAvoid loading heavy Tailwind packages to keep compiles fast and performant.',
    userId: 'Riya'
  });

  // 6. Create Mock Code Snippets
  snippets.create({
    projectId: coreProj.id,
    title: 'Express Router Scaffolding',
    language: 'javascript',
    code: `import express from 'express';\nconst router = express.Router();\n\nrouter.get('/health', (req, res) => {\n  res.json({ status: 'active', timestamp: new Date() });\n});\n\nexport default router;`,
    tags: ['backend', 'express'],
    description: 'Standard ES module router stub for our Express API middleware.'
  });

  snippets.create({
    projectId: coreProj.id,
    title: 'Bcrypt Hashing Helper',
    language: 'javascript',
    code: `import bcrypt from 'bcrypt';\n\nexport const hashValue = async (val) => {\n  const salt = await bcrypt.genSalt(10);\n  return bcrypt.hash(val, salt);\n};`,
    tags: ['security', 'helper'],
    description: 'Secure password encryption controller for the user registration pipeline.'
  });
}

// Global active presence state
// Map of projectId -> { userId: { userName, userAvatar, currentTaskId } }
const livePresence = {};

// ==========================================
// AUTHENTICATION APIs
// ==========================================
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, bio, skills, github } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Missing core credentials.' });
  }
  if (users.findByEmail(email)) {
    return res.status(400).json({ error: 'User with this email already exists.' });
  }
  const user = users.create({ name, email, password, bio, skills, github });
  
  // Find the shared DevCollab Sandbox workspace and automatically add the user as Member!
  const sandboxWs = workspaces.list().find(w => w.name === 'DevCollab Sandbox');
  if (sandboxWs) {
    workspaces.addMember(sandboxWs.id, user.email, 'Member');
    const proj = projects.listByWorkspace(sandboxWs.id)[0];
    activities.create({
      workspaceId: sandboxWs.id,
      projectId: proj?.id,
      userId: user.id,
      userName: user.name,
      actionType: 'member_joined',
      details: `${user.name} registered and joined the team sandbox.`
    });
  } else {
    // Fallback: create a personal workspace
    const workspace = workspaces.create({ name: 'Personal Workspace', ownerId: user.id });
    projects.create({ workspaceId: workspace.id, name: 'My First Project', description: 'A starter project for your workspace.' });
  }

  res.json({ success: true, user });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.findByEmail(email);
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }
  res.json({ success: true, user, token: 'mock-jwt-token' });
});

app.get('/api/users', (req, res) => {
  res.json(users.list());
});

app.get('/api/auth/verify/:userId', (req, res) => {
  const user = users.findById(req.params.userId);
  if (!user) {
    return res.status(404).json({ error: 'User does not exist in database.' });
  }
  res.json({ success: true, user });
});

// ==========================================
// WORKSPACE APIs
// ==========================================
app.get('/api/workspaces', (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(400).json({ error: 'Missing userId parameter' });
  res.json(workspaces.listByUser(userId));
});

app.post('/api/workspaces', (req, res) => {
  const { name, ownerId } = req.body;
  if (!name || !ownerId) return res.status(400).json({ error: 'Name and Owner are required' });
  
  // Enforce Free Tier Check
  const user = users.findById(ownerId);
  const userWorkspaces = workspaces.listByUser(ownerId);
  const userOwned = userWorkspaces.filter(w => w.members.find(m => m.userId === ownerId && m.role === 'Owner'));

  if (user && user.plan === 'free' && userOwned.length >= 1) {
    return res.status(403).json({ 
      error: 'Free Tier Limit Reached',
      limitTriggered: true,
      message: 'Free tier limits you to 1 workspace. Upgrade to Pro for unlimited workspaces!'
    });
  }

  const workspace = workspaces.create({ name, ownerId });
  
  activities.create({
    workspaceId: workspace.id,
    userId: ownerId,
    userName: user?.name || 'Owner',
    actionType: 'member_joined',
    details: `Workspace "${name}" was successfully constructed.`
  });

  res.json(workspace);
});

app.get('/api/workspaces/:id', (req, res) => {
  const ws = workspaces.findById(req.params.id);
  if (!ws) return res.status(404).json({ error: 'Workspace not found' });
  res.json(ws);
});

app.post('/api/workspaces/:id/invite', (req, res) => {
  const { id } = req.params;
  const { email, senderId } = req.body;
  
  const ws = workspaces.findById(id);
  if (!ws) return res.status(404).json({ error: 'Workspace not found' });

  // Free Tier Check: 5 members max
  const sender = users.findById(senderId);
  const isPro = ws.members.some(m => {
    const mem = users.findById(m.userId);
    return mem && mem.plan === 'pro';
  }) || (sender && sender.plan === 'pro');

  if (!isPro && ws.members.length >= 5) {
    return res.status(403).json({
      error: 'Free Tier Limit Reached',
      limitTriggered: true,
      message: 'Free tier workspaces are limited to 5 members. Please upgrade to Pro!'
    });
  }

  workspaces.addInvite(id, email);
  
  // Simulate automated invite emailing by adding an activity logs
  const senderUser = users.findById(senderId);
  activities.create({
    workspaceId: id,
    userId: senderId,
    userName: senderUser?.name || 'Admin',
    actionType: 'member_joined',
    details: `Dispatched email invitation to ${email}`
  });

  // If invited email matches an existing user, automatically notify them in-app
  const invitedUser = users.findByEmail(email);
  if (invitedUser) {
    notifications.create({
      userId: invitedUser.id,
      type: 'system',
      title: 'Workspace Invitation',
      message: `${senderUser?.name || 'Someone'} invited you to join the workspace "${ws.name}".`
    });
  }

  res.json({ success: true, workspace: ws });
});

app.post('/api/workspaces/:id/join', (req, res) => {
  const { id } = req.params;
  const { email } = req.body;

  const ws = workspaces.findById(id);
  if (!ws) return res.status(404).json({ error: 'Workspace not found' });

  const joined = workspaces.addMember(id, email, 'Member');
  if (!joined) {
    return res.status(400).json({ error: 'No user registered with this email or invitation was not issued.' });
  }

  const user = users.findByEmail(email);
  activities.create({
    workspaceId: id,
    userId: user.id,
    userName: user.name,
    actionType: 'member_joined',
    details: `${user.name} joined the workspace.`
  });

  res.json({ success: true, workspace: joined });
});

// ==========================================
// PROJECT APIs
// ==========================================
app.get('/api/workspaces/:workspaceId/projects', (req, res) => {
  res.json(projects.listByWorkspace(req.params.workspaceId));
});

app.post('/api/projects', (req, res) => {
  const { workspaceId, name, description, userId } = req.body;
  if (!workspaceId || !name) return res.status(400).json({ error: 'Workspace and Name required.' });

  // Free Tier Check: max 3 projects
  const ws = workspaces.findById(workspaceId);
  const projList = projects.listByWorkspace(workspaceId);
  const user = users.findById(userId);
  const isPro = (user && user.plan === 'pro') || ws?.members.some(m => users.findById(m.userId)?.plan === 'pro');

  if (!isPro && projList.length >= 3) {
    return res.status(403).json({
      error: 'Free Tier Limit Reached',
      limitTriggered: true,
      message: 'Free tier workspaces are limited to 3 projects. Upgrade to Pro for unlimited creation!'
    });
  }

  const project = projects.create({ workspaceId, name, description });
  const activeUser = users.findById(userId);
  
  activities.create({
    workspaceId,
    projectId: project.id,
    userId,
    userName: activeUser?.name || 'Developer',
    actionType: 'task_created',
    details: `Constructed project folder "${name}"`
  });

  res.json(project);
});

// ==========================================
// TASK APIs
// ==========================================
app.get('/api/projects/:projectId/tasks', (req, res) => {
  res.json(tasks.listByProject(req.params.projectId));
});

app.post('/api/tasks', (req, res) => {
  const { projectId, title, description, assigneeId, priority, dueDate, labels, attachments, checklist, userId } = req.body;
  if (!projectId || !title) return res.status(400).json({ error: 'Project and Title required.' });

  const task = tasks.create({ projectId, title, description, assigneeId, priority, dueDate, labels, attachments, checklist });
  const activeUser = users.findById(userId);
  const proj = projects.findById(projectId);

  activities.create({
    workspaceId: proj?.workspaceId,
    projectId,
    userId,
    userName: activeUser?.name || 'Developer',
    actionType: 'task_created',
    details: `Created Kanban task: "${title}"`
  });

  if (assigneeId && assigneeId !== userId) {
    notifications.create({
      userId: assigneeId,
      type: 'assignment',
      title: 'New Task Assignment',
      message: `${activeUser?.name || 'A teammate'} assigned you the task: "${title}"`
    });
  }

  // Notify socket room
  io.to(`project_${projectId}`).emit('task_changed', { action: 'create', task });

  res.json(task);
});

app.put('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, assigneeId, status, priority, dueDate, labels, attachments, checklist, userId } = req.body;
  
  const existingTask = tasks.findById(id);
  if (!existingTask) return res.status(404).json({ error: 'Task not found' });

  const oldStatus = existingTask.status;
  const oldAssignee = existingTask.assigneeId;

  const updated = tasks.update(id, { title, description, assigneeId, status, priority, dueDate, labels, attachments, checklist });
  const activeUser = users.findById(userId);
  const proj = projects.findById(updated.projectId);

  // Identify socket event reasons to construct intelligent activity updates
  if (status && oldStatus !== status) {
    const mapStatus = { todo: 'To Do', in_progress: 'In Progress', in_review: 'In Review', done: 'Done' };
    activities.create({
      workspaceId: proj?.workspaceId,
      projectId: updated.projectId,
      userId,
      userName: activeUser?.name || 'Teammate',
      actionType: 'task_moved',
      details: `Moved task "${updated.title}" from [${mapStatus[oldStatus]}] to [${mapStatus[status]}]`
    });

    // Notify assignee if someone else moved their task
    if (updated.assigneeId && updated.assigneeId !== userId) {
      notifications.create({
        userId: updated.assigneeId,
        type: 'mention',
        title: 'Task Status Updated',
        message: `${activeUser?.name || 'Someone'} moved your task "${updated.title}" to ${mapStatus[status]}.`
      });
    }
  } else {
    activities.create({
      workspaceId: proj?.workspaceId,
      projectId: updated.projectId,
      userId,
      userName: activeUser?.name || 'Teammate',
      actionType: 'task_created',
      details: `Edited properties of task "${updated.title}"`
    });
  }

  // Assignee changed
  if (assigneeId && oldAssignee !== assigneeId && assigneeId !== userId) {
    notifications.create({
      userId: assigneeId,
      type: 'assignment',
      title: 'New Task Assignment',
      message: `${activeUser?.name || 'A teammate'} assigned you the task: "${updated.title}"`
    });
  }

  // Socket notification
  io.to(`project_${updated.projectId}`).emit('task_changed', { action: 'update', task: updated });

  res.json(updated);
});

app.delete('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  const task = tasks.findById(id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const projectId = task.projectId;
  const proj = projects.findById(projectId);
  const activeUser = users.findById(userId);

  tasks.delete(id);

  activities.create({
    workspaceId: proj?.workspaceId,
    projectId,
    userId,
    userName: activeUser?.name || 'Teammate',
    actionType: 'task_moved',
    details: `Deleted task: "${task.title}"`
  });

  io.to(`project_${projectId}`).emit('task_changed', { action: 'delete', taskId: id });
  res.json({ success: true });
});

// ==========================================
// COMMENTS APIs
// ==========================================
app.get('/api/tasks/:taskId/comments', (req, res) => {
  res.json(comments.listByTask(req.params.taskId));
});

app.post('/api/comments', (req, res) => {
  const { taskId, userId, content } = req.body;
  if (!taskId || !userId || !content) return res.status(400).json({ error: 'Params missing.' });

  const user = users.findById(userId);
  const task = tasks.findById(taskId);
  if (!task) return res.status(404).json({ error: 'Task not found.' });

  const newComment = comments.create({
    taskId,
    userId,
    userName: user?.name || 'Anonymous',
    userAvatar: user?.avatar,
    content
  });

  const proj = projects.findById(task.projectId);
  activities.create({
    workspaceId: proj?.workspaceId,
    projectId: task.projectId,
    userId,
    userName: user?.name || 'Anonymous',
    actionType: 'comment_added',
    details: `Commented on task "${task.title}": "${content.substring(0, 30)}..."`
  });

  // Handle @mentions
  const mentionRegex = /@(\w+)/g;
  let match;
  while ((match = mentionRegex.exec(content)) !== null) {
    const mentionedName = match[1];
    const targetUser = users.list().find(u => u.name.toLowerCase() === mentionedName.toLowerCase());
    
    if (targetUser && targetUser.id !== userId) {
      notifications.create({
        userId: targetUser.id,
        type: 'mention',
        title: 'Task Comment @Mention',
        message: `${user?.name || 'Someone'} tagged you in a comment inside "${task.title}": "${content.substring(0, 45)}"`
      });
    }
  }

  // Socket notification
  io.to(`project_${task.projectId}`).emit('comment_changed', { action: 'create', comment: newComment });

  res.json(newComment);
});

// ==========================================
// DOCUMENT/WIKI APIs
// ==========================================
app.get('/api/projects/:projectId/docs', (req, res) => {
  res.json(docs.listByProject(req.params.projectId));
});

app.post('/api/docs', (req, res) => {
  const { projectId, title, content, parentDocId, userId } = req.body;
  if (!projectId || !title) return res.status(400).json({ error: 'Project and Title required' });

  const user = users.findById(userId);
  const newDoc = docs.create({ projectId, title, content, parentDocId, userId: user?.name });
  const proj = projects.findById(projectId);

  activities.create({
    workspaceId: proj?.workspaceId,
    projectId,
    userId,
    userName: user?.name || 'Developer',
    actionType: 'doc_updated',
    details: `Created Notion wiki page: "${title}"`
  });

  io.to(`project_${projectId}`).emit('doc_changed', { action: 'create', doc: newDoc });
  res.json(newDoc);
});

app.put('/api/docs/:id', (req, res) => {
  const { id } = req.params;
  const { title, content, parentDocId, userId } = req.body;

  const user = users.findById(userId);
  const updated = docs.update(id, { title, content, parentDocId }, user?.name);
  if (!updated) return res.status(404).json({ error: 'Wiki page not found' });

  const proj = projects.findById(updated.projectId);
  activities.create({
    workspaceId: proj?.workspaceId,
    projectId: updated.projectId,
    userId,
    userName: user?.name || 'Developer',
    actionType: 'doc_updated',
    details: `Updated wiki documentation: "${updated.title}"`
  });

  io.to(`project_${updated.projectId}`).emit('doc_changed', { action: 'update', doc: updated });
  res.json(updated);
});

app.post('/api/docs/:id/rollback', (req, res) => {
  const { id } = req.params;
  const { versionId, userId } = req.body;

  const doc = docs.rollbackVersion(id, versionId);
  if (!doc) return res.status(400).json({ error: 'Rollback failed. Invalid ID' });

  const user = users.findById(userId);
  const proj = projects.findById(doc.projectId);

  activities.create({
    workspaceId: proj?.workspaceId,
    projectId: doc.projectId,
    userId,
    userName: user?.name || 'Developer',
    actionType: 'doc_updated',
    details: `Rolled back wiki page "${doc.title}" to historical version`
  });

  io.to(`project_${doc.projectId}`).emit('doc_changed', { action: 'update', doc });
  res.json(doc);
});

app.delete('/api/docs/:id', (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  const doc = docs.findById(id);
  if (!doc) return res.status(404).json({ error: 'Document not found.' });

  const projectId = doc.projectId;
  const proj = projects.findById(projectId);
  const user = users.findById(userId);

  docs.delete(id);

  activities.create({
    workspaceId: proj?.workspaceId,
    projectId,
    userId,
    userName: user?.name || 'Developer',
    actionType: 'doc_updated',
    details: `Deleted wiki page: "${doc.title}"`
  });

  io.to(`project_${projectId}`).emit('doc_changed', { action: 'delete', docId: id });
  res.json({ success: true });
});

// ==========================================
// CODE SNIPPET APIs
// ==========================================
app.get('/api/projects/:projectId/snippets', (req, res) => {
  res.json(snippets.listByProject(req.params.projectId));
});

app.post('/api/snippets', (req, res) => {
  const { projectId, title, language, code, tags, description, userId } = req.body;
  if (!projectId || !title || !code) return res.status(400).json({ error: 'Missing properties.' });

  const snippet = snippets.create({ projectId, title, language, code, tags, description });
  const user = users.findById(userId);
  const proj = projects.findById(projectId);

  activities.create({
    workspaceId: proj?.workspaceId,
    projectId,
    userId,
    userName: user?.name || 'Developer',
    actionType: 'task_created',
    details: `Saved reusable snippet code block: "${title}"`
  });

  res.json(snippet);
});

app.delete('/api/snippets/:id', (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  const snippet = snippets.findById(id);
  if (!snippet) return res.status(404).json({ error: 'Snippet not found' });

  const proj = projects.findById(snippet.projectId);
  const user = users.findById(userId);

  snippets.delete(id);

  activities.create({
    workspaceId: proj?.workspaceId,
    projectId: snippet.projectId,
    userId,
    userName: user?.name || 'Developer',
    actionType: 'task_created',
    details: `Removed code block: "${snippet.title}"`
  });

  res.json({ success: true });
});

// ==========================================
// ACTIVITY FEED LOGS
// ==========================================
app.get('/api/workspaces/:workspaceId/activities', (req, res) => {
  res.json(activities.listByWorkspace(req.params.workspaceId));
});

// ==========================================
// NOTIFICATIONS APIs
// ==========================================
app.get('/api/users/:userId/notifications', (req, res) => {
  res.json(notifications.listByUser(req.params.userId));
});

app.post('/api/notifications/:id/read', (req, res) => {
  res.json(notifications.markRead(req.params.id));
});

app.post('/api/notifications/read-all', (req, res) => {
  const { userId } = req.body;
  notifications.markAllRead(userId);
  res.json({ success: true });
});

// ==========================================
// AI ASSISTANT APIs
// ==========================================
app.post('/api/ai/summarize', (req, res) => {
  const { projectId, projectName } = req.body;
  const list = tasks.listByProject(projectId);
  const summary = aiService.summarizeProject(projectName, list, users.list());
  res.json({ result: summary });
});

app.post('/api/ai/blockers', (req, res) => {
  const { projectId, projectName } = req.body;
  const list = tasks.listByProject(projectId);
  const diagnosis = aiService.findBlockers(projectName, list, users.list());
  res.json({ result: diagnosis });
});

app.post('/api/ai/standup', (req, res) => {
  const { workspaceId, projectName, username } = req.body;
  const list = activities.listByWorkspace(workspaceId);
  const standup = aiService.generateStandup(projectName, list, username);
  res.json({ result: standup });
});

app.post('/api/ai/breakdown', (req, res) => {
  const { projectId, description, userId } = req.body;
  if (!projectId || !description) return res.status(400).json({ error: 'Params missing.' });

  const generatedSubtasks = aiService.generateTaskBreakdown(description);
  
  // Automatically create all 6 tasks in the database and register workspace activities!
  const proj = projects.findById(projectId);
  const activeUser = users.findById(userId);

  const insertedTasks = generatedSubtasks.map(stub => {
    return tasks.create({
      projectId,
      title: stub.title,
      description: stub.desc,
      priority: stub.priority,
      labels: stub.labels,
      status: 'todo',
      assigneeId: null
    });
  });

  activities.create({
    workspaceId: proj?.workspaceId,
    projectId,
    userId,
    userName: activeUser?.name || 'AI Assistant',
    actionType: 'task_created',
    details: `AI generated task breakdown with ${insertedTasks.length} cards for features: "${description}"`
  });

  // Notify socket room
  io.to(`project_${projectId}`).emit('tasks_reload', { projectId });

  res.json({ success: true, tasks: insertedTasks });
});

app.post('/api/ai/review', (req, res) => {
  const { language, code } = req.body;
  const reviewResult = aiService.reviewCode(language, code);
  res.json(reviewResult);
});

// ==========================================
// SANDBOX CHECKOUT PAYMENT
// ==========================================
app.post('/api/payments/checkout', (req, res) => {
  const { userId, workspaceId, cardNumber, cardExpiry, cardCVC } = req.body;

  if (!userId || !workspaceId) {
    return res.status(400).json({ error: 'Missing checkout parameters.' });
  }

  // Simulate payment processing validation rules
  if (!cardNumber || cardNumber.length < 16) {
    return res.status(400).json({ error: 'Declined. Invalid 16-digit card number.' });
  }
  if (!cardCVC || cardCVC.length < 3) {
    return res.status(400).json({ error: 'Declined. Invalid security CVC format.' });
  }

  // Success Sandbox Payment process
  // Upgrade user's workspace plan to Pro
  const user = users.update(userId, { plan: 'pro' });
  
  activities.create({
    workspaceId,
    userId,
    userName: user.name,
    actionType: 'member_joined',
    details: `Workspace upgraded to Pro tier. Sandbox Checkout successfully authorized.`
  });

  // Notify user
  notifications.create({
    userId,
    type: 'system',
    title: 'Workspace Upgraded to Pro',
    message: 'Sandbox transaction complete! Premium unlimited limits and AI features unlocked!'
  });

  res.json({ success: true, user });
});

// ==========================================
// SOCKET.IO CONTROLLERS
// ==========================================
io.on('connection', (socket) => {
  console.log(`Socket user connected: ${socket.id}`);

  socket.on('join_project', ({ projectId, userId, userName, userAvatar }) => {
    socket.join(`project_${projectId}`);
    socket.projectId = projectId;
    socket.userId = userId;
    socket.userName = userName;

    // Track active presence
    if (!livePresence[projectId]) {
      livePresence[projectId] = {};
    }
    
    livePresence[projectId][userId] = {
      userName,
      userAvatar: userAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(userName)}`,
      currentTaskId: null
    };

    // Broadcast update of active presence lists
    io.to(`project_${projectId}`).emit('presence_updated', livePresence[projectId]);
  });

  socket.on('viewing_task', ({ projectId, taskId, userId }) => {
    if (livePresence[projectId] && livePresence[projectId][userId]) {
      livePresence[projectId][userId].currentTaskId = taskId;
      io.to(`project_${projectId}`).emit('presence_updated', livePresence[projectId]);
    }
  });

  socket.on('leaving_task', ({ projectId, userId }) => {
    if (livePresence[projectId] && livePresence[projectId][userId]) {
      livePresence[projectId][userId].currentTaskId = null;
      io.to(`project_${projectId}`).emit('presence_updated', livePresence[projectId]);
    }
  });

  socket.on('disconnect', () => {
    const { projectId, userId } = socket;
    if (projectId && userId && livePresence[projectId] && livePresence[projectId][userId]) {
      delete livePresence[projectId][userId];
      if (Object.keys(livePresence[projectId]).length === 0) {
        delete livePresence[projectId];
      } else {
        io.to(`project_${projectId}`).emit('presence_updated', livePresence[projectId]);
      }
    }
    console.log(`Socket user disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`DevCollab backend active on port ${PORT}`);
});
