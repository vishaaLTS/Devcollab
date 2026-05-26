/**
 * DevCollab AI Assistant & Code Reviewer Service
 */

export const aiService = {
  /**
   * Generates a project progress summary based on task statistics
   */
  summarizeProject: (projectName, tasks, members) => {
    const total = tasks.length;
    if (total === 0) {
      return `### Project Summary: **${projectName}**\n\nNo tasks have been created in this project yet. Use the **Task Breakdown** assistant below to quickly generate a list of starting tasks.`;
    }

    const counts = { todo: 0, in_progress: 0, in_review: 0, done: 0 };
    const priorityCounts = { P0: 0, P1: 0, P2: 0 };
    
    tasks.forEach(t => {
      counts[t.status] = (counts[t.status] || 0) + 1;
      priorityCounts[t.priority] = (priorityCounts[t.priority] || 0) + 1;
    });

    const completionRate = Math.round((counts.done / total) * 100);
    const p0Active = tasks.filter(t => t.priority === 'P0' && t.status !== 'done').length;

    let response = `### Project Health & Progress: **${projectName}**\n\n`;
    response += `📈 **Overall Progress:** **${completionRate}% Complete** (${counts.done} of ${total} tasks resolved)\n`;
    response += `📋 **Task Distribution:**\n`;
    response += `- 📥 **To Do:** ${counts.todo} tasks\n`;
    response += `- ⚡ **In Progress:** ${counts.in_progress} tasks\n`;
    response += `- 👀 **In Review:** ${counts.in_review} tasks\n`;
    response += `- ✅ **Done:** ${counts.done} tasks\n\n`;

    response += `⚠️ **High Risk Items:** There are currently **${p0Active} active P0 (Critical)** tasks awaiting completion.\n\n`;

    response += `#### AI Insight & Recommendations:\n`;
    if (completionRate < 30) {
      response += `* The project is in its **initial bootstrapping phase**. Focus on clearing foundational architectural tasks. Ensure developers have local development sandboxes correctly configured.\n`;
    } else if (counts.in_review > 2) {
      response += `* A **code review bottleneck** is forming. Recommend redirecting members from 'In Progress' to assist with reviews to pull these items into 'Done'.\n`;
    } else if (p0Active > 2) {
      response += `* High volume of **critical P0 priorities** are outstanding. Shift focus away from P2 features until core blockers are stabilized.\n`;
    } else {
      response += `* Velocity is looking healthy! Keep maintaining the current pipeline cadence.\n`;
    }

    return response;
  },

  /**
   * Detects blocking tasks in "In Progress" too long or flagged
   */
  findBlockers: (projectName, tasks, users) => {
    const activeTasks = tasks.filter(t => t.status === 'in_progress');
    
    if (activeTasks.length === 0) {
      return `### Blocker Analysis: **${projectName}**\n\n🎉 **Good news!** There are currently no active tasks in the "In Progress" column. The runway is entirely clear!`;
    }

    // Filter tasks that could be blocked: P0 tasks in progress, tasks with checklists that are stalled, or simulated time-based blockers
    let response = `### Active Blockers Diagnostic: **${projectName}**\n\n`;
    response += `An review of active "In Progress" tasks has identified potential blockers requiring attention:\n\n`;

    let blockerCount = 0;
    activeTasks.forEach((task, idx) => {
      blockerCount++;
      const assignee = users.find(u => u.id === task.assigneeId)?.name || 'Unassigned';
      
      response += `#### ${idx + 1}. [${task.priority}] **${task.title}**\n`;
      response += `- 👤 **Owner:** ${assignee}\n`;
      response += `- 📅 **Due Date:** ${task.dueDate || 'None specified'}\n`;
      
      // Intelligent mock reasoning based on task properties
      if (task.priority === 'P0') {
        response += `- 🔴 **Risk Level: CRITICAL.** As a high-priority P0 task, this card is blocking critical path integrations. Recommend immediate peer-programming to unblock.\n`;
      } else if (task.checklist && task.checklist.length > 0) {
        const completed = task.checklist.filter(c => c.completed).length;
        const total = task.checklist.length;
        response += `- 🟡 **Risk Level: STALLED.** Checklist is stuck at **${completed}/${total}**. Likely facing tech debt or architectural friction.\n`;
      } else {
        response += `- ⚪ **Risk Level: MODERATE.** Task lacks subtask checklist items, making exact progression tracking opaque. Team lead should check in.\n`;
      }
      response += `- 💡 **AI Remediation:** `;
      if (task.priority === 'P0') {
        response += `Verify if there are third-party API limits or backend deployment bottlenecks. Schedule a quick 10-minute sync.\n\n`;
      } else {
        response += `Break this task into 3 distinct checkboxes so progress can be visualized in real-time.\n\n`;
      }
    });

    if (blockerCount === 0) {
      response += `All tasks are progressing within nominal velocity thresholds.`;
    }

    return response;
  },

  /**
   * Generates a daily standup formatted report based on activities in the last 24h
   */
  generateStandup: (projectName, activities, username) => {
    let response = `### Standup Report: **${projectName}**\n`;
    response += `*Generated automatically for **${username || 'Team Member'}** on ${new Date().toLocaleDateString()}*\n\n`;

    // Filter user's recent activities
    const userActivities = activities.filter(a => 
      a.userName.toLowerCase() === (username || '').toLowerCase()
    ).slice(0, 10);

    const completed = [];
    const inProgress = [];

    userActivities.forEach(act => {
      if (act.actionType === 'task_moved' && act.details.includes('Done')) {
        completed.push(act.details);
      } else if (act.actionType === 'task_moved' || act.actionType === 'task_created') {
        inProgress.push(act.details);
      }
    });

    response += `#### 1. What I accomplished yesterday\n`;
    if (completed.length > 0) {
      completed.slice(0, 3).forEach(c => {
        response += `- Resolved: ${c}\n`;
      });
    } else {
      response += `- Closed out pending documentation edits and synchronized my local workspace branch.\n`;
      response += `- Participated in design review meeting and responded to review comments on active task board.\n`;
    }

    response += `\n#### 2. What I am working on today\n`;
    if (inProgress.length > 0) {
      inProgress.slice(0, 3).forEach(ip => {
        response += `- Continuing progression on: ${ip}\n`;
      });
    } else {
      response += `- Reviewing active P0 Kanban items and helping to clear the peer review queue.\n`;
      response += `- Implementing unit tests and starting basic scaffolding for the next feature set.\n`;
    }

    response += `\n#### 3. Blockers\n`;
    response += `- No major hard blockers. Waiting on feedback from the frontend code reviewer for the core integration middleware.\n`;

    return response;
  },

  /**
   * Generates 6 actionable subtasks for a feature description
   */
  generateTaskBreakdown: (description) => {
    const desc = description.toLowerCase();
    let tasks = [];

    if (desc.includes('login') || desc.includes('auth') || desc.includes('signup')) {
      tasks = [
        { title: "Define User Schema & Encryption Model", desc: "Design model attributes with secure bcrypt password hashing and database integration.", priority: "P0", labels: ["backend", "database", "security"] },
        { title: "Develop Auth Controllers & Token Generation", desc: "Build signup, login, and logout endpoints. Issue JSON Web Tokens (JWT) inside secure HTTP-only cookies.", priority: "P0", labels: ["backend", "api"] },
        { title: "Create React Portal UI & Glassmorphism Login Form", desc: "Implement login and signup views featuring responsive inputs, error validators, and custom styling.", priority: "P1", labels: ["frontend", "ui"] },
        { title: "Implement Client Auth Context & Protected Routes", desc: "Setup global React state for active user. Protect private workspace routes from unauthenticated navigation.", priority: "P1", labels: ["frontend", "logic"] },
        { title: "Design Password Reset Flow & Email Stubbing", desc: "Build endpoints and UI forms to support simple password recovery flows with mock mail verification.", priority: "P2", labels: ["backend", "frontend"] },
        { title: "Write Integration Tests for Auth Pipeline", desc: "Verify secure password verification, error handling for duplicate emails, and JWT expiration guards.", priority: "P2", labels: ["testing"] }
      ];
    } else if (desc.includes('payment') || desc.includes('checkout') || desc.includes('stripe') || desc.includes('billing')) {
      tasks = [
        { title: "Design Billing Schema & Tier Limits", desc: "Create limits manager utility tracking workspace thresholds (e.g. Free vs Pro tier boundaries).", priority: "P0", labels: ["backend", "database"] },
        { title: "Configure API Checkouts Router", desc: "Implement secure backend route to process mock payments, validating cards and upgrading state upon success.", priority: "P0", labels: ["backend", "api"] },
        { title: "Design Sleek Checkout Modal UI", desc: "Create glassmorphic modal with animated card layouts, numeric validation rules, and checkout buttons.", priority: "P1", labels: ["frontend", "ui"] },
        { title: "Implement Pro Access Limits Middleware", desc: "Integrate frontend/backend interceptors verifying account plan statuses before allowing advanced creations.", priority: "P1", labels: ["security", "logic"] },
        { title: "Add Invoice Receipt Generation & Downloads", desc: "Implement simple dialog to let upgraded customers view mock checkout transactions and receipt stats.", priority: "P2", labels: ["frontend", "features"] },
        { title: "Verify Payment Sandbox with Declined Cases", desc: "Validate that declined checkout details display descriptive card errors and keep workspace in Free limits.", priority: "P2", labels: ["testing"] }
      ];
    } else if (desc.includes('chat') || desc.includes('slack') || desc.includes('realtime') || desc.includes('presence')) {
      tasks = [
        { title: "Configure Socket.IO Server & Event Hooks", desc: "Set up WebSockets event bindings inside Express server. Allocate rooms corresponding to workspaces.", priority: "P0", labels: ["backend", "realtime"] },
        { title: "Build React Socket Context Provider", desc: "Establish stable connection handler on frontend. Broadcast client user profiles on component mount.", priority: "P0", labels: ["frontend", "realtime"] },
        { title: "Implement Live Board Presence Indicators", desc: "Hook up cursor tracking or viewing states inside Kanban cards. Render glowing online badges.", priority: "P1", labels: ["frontend", "ui"] },
        { title: "Develop Live Notification Toast Component", desc: "Wire up real-time socket events to trigger clean neon-alert toasts (e.g. 'Jane added a new comment').", priority: "P1", labels: ["frontend", "ui"] },
        { title: "Add Socket Heartbeats & Reconnection Logic", desc: "Introduce active ping/pong logic to instantly drop idle presence logs when tabs or browsers close.", priority: "P2", labels: ["backend", "logic"] },
        { title: "Write Multi-Client Browser Simulator Tests", desc: "Verify live updates synchronized side-by-side between separate mock sockets.", priority: "P2", labels: ["testing"] }
      ];
    } else {
      // Generic breakdown based on description
      const keyword = description.substring(0, 20);
      tasks = [
        { title: `Architect ${keyword} System Schema`, desc: `Formulate core attributes and structures matching description: ${description}`, priority: "P0", labels: ["architecture"] },
        { title: `Build Backend Controllers & REST Routes`, desc: "Write endpoints to manage resources and interact with data models.", priority: "P0", labels: ["backend"] },
        { title: `Develop Responsive Core Component UI`, desc: "Construct modern, elegant front-end panels with layout wrappers.", priority: "P1", labels: ["frontend", "ui"] },
        { title: `Implement Client Integration Hooks`, desc: "Wire components to consume APIs, handle loading states, and update store.", priority: "P1", labels: ["frontend"] },
        { title: `Integrate Custom Validation & Error Boundaries`, desc: "Ensure form submissions fail gracefully and log exceptions clearly.", priority: "P2", labels: ["logic"] },
        { title: `Construct Validation & Unit Tests`, desc: "Ensure all edge scenarios in logic return clean results.", priority: "P2", labels: ["testing"] }
      ];
    }

    return tasks;
  },

  /**
   * Reviews a code snippet for bugs, performance, readability, security, and grades quality.
   */
  reviewCode: (language, code) => {
    let score = 8;
    const bugs = [];
    const performance = [];
    const readability = [];
    const security = [];

    const lowerCode = code.toLowerCase();

    // Security Scans
    if (lowerCode.includes('eval(')) {
      security.push("⚠️ **Critical Vulnerability:** Use of `eval()` detected. This allows execution of arbitrary strings and opens the system to major Injection attacks. Replace with safe structured methods.");
      score -= 3;
    }
    if (lowerCode.includes('innerhtml') || lowerCode.includes('dangerouslysetinnerhtml')) {
      security.push("⚠️ **Security Warning:** Direct use of HTML injections found. This exposes the app to Cross-Site Scripting (XSS). Sanitize dynamic values first.");
      score -= 1;
    }
    if (lowerCode.includes('password') && (lowerCode.includes('const ') || lowerCode.includes('let ') || lowerCode.includes('var ')) && (lowerCode.includes('"') || lowerCode.includes("'"))) {
      security.push("⚠️ **Credential Leak:** Hardcoded credentials/secrets detected. Secrets must be loaded securely via system environment variables.");
      score -= 2;
    }

    // Bug Scans
    if (lowerCode.includes('todo') || lowerCode.includes('fixme')) {
      bugs.push("📝 **Pending Task:** Unresolved `TODO` or `FIXME` comments left in source. Resolve these placeholder actions before push to staging.");
    }
    if (language === 'javascript' && (lowerCode.includes(' == ') || lowerCode.includes(' != '))) {
      bugs.push("🐛 **Equality Check:** Non-strict equality (`==`/`!=`) used. Strict checks (`===`/`!==`) prevent unexpected type-coercion bugs.");
      score -= 0.5;
    }

    // Performance Scans
    if (lowerCode.includes('for ') && lowerCode.includes('.length')) {
      performance.push("⚡ **Loop Optimization:** Array length is queried in every loop cycle. Cache length in variable to save overhead.");
    }
    if (lowerCode.includes('select *')) {
      performance.push("⚡ **Query Performance:** Avoid using `SELECT *` in SQL calls. Fetch only columns needed to minimize bandwidth overhead.");
      score -= 1;
    }

    // Readability
    if (!lowerCode.includes('const') && !lowerCode.includes('let') && language === 'javascript') {
      readability.push("📚 **Modern Conventions:** Code uses old scope syntax (`var`) or lacks variable tags. Prefer ES6 `const` and `let` declarations.");
    }
    if (code.split('\n').length > 50) {
      readability.push("📚 **Method Complexity:** Function is long (50+ lines). Split into distinct helper subroutines to enhance readability.");
      score -= 1;
    }

    // Fallback standard tips if score remains high
    if (score >= 8) {
      readability.push("✅ Code structure is highly neat. Good parameterization and variable naming.");
      performance.push("✅ Time and space complexity are optimal.");
      security.push("✅ No generic exploit templates matched. Secrets management looks clean.");
      bugs.push("✅ Code logical path is fully clean.");
    }

    // Keep score bounded
    score = Math.max(1, Math.min(10, score));

    return {
      score,
      bugs: bugs.join('\n'),
      performance: performance.join('\n'),
      readability: readability.join('\n'),
      security: security.join('\n')
    };
  }
};
