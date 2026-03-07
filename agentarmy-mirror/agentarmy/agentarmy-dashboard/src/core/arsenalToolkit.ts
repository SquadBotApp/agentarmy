// arsenalToolkit.ts — Subsystem #62
// The "Deplorables Arsenal" — a comprehensive toolkit registry with 200 tools
// (100 free + 100 paid) spanning Productivity, Development, AI/Data, Security,
// Media/Creative, System Utilities, Browsers/Communication, Design/UX,
// Enterprise, and Specialized categories.
// Provides search, filtering, licensing validation, and usage tracking.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Pricing tier for an arsenal tool. */
export type ArsenalTier = 'free' | 'paid';

/** Top-level tool categories. */
export type ArsenalCategory =
  | 'productivity'
  | 'development'
  | 'ai-data'
  | 'security'
  | 'media-creative'
  | 'system-utilities'
  | 'browsers-communication'
  | 'design-ux'
  | 'enterprise'
  | 'specialized';

/** A single tool entry in the arsenal. */
export interface ArsenalTool {
  id: number;
  name: string;
  category: ArsenalCategory;
  tier: ArsenalTier;
  description: string;
  url: string;
  tags: string[];
  rating: number;          // 0-5
  usageCount: number;
  /** true when the user holds a valid license (free tools are always licensed) */
  licensed: boolean;
}

/** Filters for querying the arsenal. */
export interface ArsenalFilter {
  category?: ArsenalCategory;
  tier?: ArsenalTier;
  tags?: string[];
  minRating?: number;
  searchText?: string;
}

/** Summary exposed to TotalSystemUnification dashboard. */
export interface ArsenalSummary {
  totalTools: number;
  freeTools: number;
  paidTools: number;
  categories: number;
  licensedTools: number;
  totalUsage: number;
  topCategory: string;
  averageRating: number;
  eventCount: number;
}

/** Events emitted by the arsenal. */
export interface ArsenalEvent {
  kind: 'tool-used' | 'tool-licensed' | 'search' | 'reset';
  toolId: number | null;
  toolName: string;
  timestamp: number;
  payload: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Tool catalog — 200 entries (100 free + 100 paid)
// ---------------------------------------------------------------------------

function buildCatalog(): ArsenalTool[] {
  const tools: ArsenalTool[] = [];
  let id = 0;

  const add = (
    name: string,
    category: ArsenalCategory,
    tier: ArsenalTier,
    description: string,
    url: string,
    tags: string[],
  ): void => {
    id++;
    tools.push({
      id,
      name,
      category,
      tier,
      description,
      url,
      tags,
      rating: Number.parseFloat((3.5 + Math.random() * 1.5).toFixed(1)),
      usageCount: 0,
      licensed: tier === 'free',
    });
  };

  // =========================================================================
  // PRODUCTIVITY (20 tools — 10 free, 10 paid)
  // =========================================================================
  add('Notion', 'productivity', 'free', 'All-in-one workspace for notes, docs, and project management', 'https://notion.so', ['notes', 'wiki', 'kanban']);
  add('Obsidian', 'productivity', 'free', 'Knowledge base with Markdown and graph view', 'https://obsidian.md', ['markdown', 'knowledge-graph']);
  add('Trello', 'productivity', 'free', 'Visual Kanban board for task management', 'https://trello.com', ['kanban', 'boards']);
  add('Todoist', 'productivity', 'free', 'Smart task manager with natural language input', 'https://todoist.com', ['tasks', 'todo']);
  add('Google Docs', 'productivity', 'free', 'Collaborative real-time document editing', 'https://docs.google.com', ['docs', 'collaboration']);
  add('Zettlr', 'productivity', 'free', 'Academic Markdown editor with Zettelkasten support', 'https://zettlr.com', ['markdown', 'academic']);
  add('Joplin', 'productivity', 'free', 'Open-source note-taking with sync and encryption', 'https://joplinapp.org', ['notes', 'encryption']);
  add('LibreOffice', 'productivity', 'free', 'Full office suite: writer, calc, impress', 'https://libreoffice.org', ['office', 'spreadsheet']);
  add('Logseq', 'productivity', 'free', 'Privacy-first knowledge management with outliner', 'https://logseq.com', ['outliner', 'knowledge-graph']);
  add('Standard Notes', 'productivity', 'free', 'Encrypted note-taking with longevity focus', 'https://standardnotes.com', ['notes', 'encryption']);
  add('Monday.com', 'productivity', 'paid', 'Work OS for team project management and automation', 'https://monday.com', ['project-management', 'automation']);
  add('Asana', 'productivity', 'paid', 'Enterprise project tracking with timeline and goals', 'https://asana.com', ['project-management', 'goals']);
  add('ClickUp', 'productivity', 'paid', 'All-in-one productivity with docs, goals, and whiteboards', 'https://clickup.com', ['project-management', 'whiteboard']);
  add('Roam Research', 'productivity', 'paid', 'Networked thought tool with bidirectional linking', 'https://roamresearch.com', ['knowledge-graph', 'bidirectional']);
  add('Craft', 'productivity', 'paid', 'Beautiful document creation with real-time collaboration', 'https://craft.do', ['docs', 'design']);
  add('Basecamp', 'productivity', 'paid', 'Project management with message boards and schedules', 'https://basecamp.com', ['project-management', 'communication']);
  add('Airtable', 'productivity', 'paid', 'Spreadsheet-database hybrid with automations', 'https://airtable.com', ['database', 'automation']);
  add('Microsoft 365', 'productivity', 'paid', 'Full productivity suite: Word, Excel, PowerPoint, Teams', 'https://microsoft.com/microsoft-365', ['office', 'teams']);
  add('Coda', 'productivity', 'paid', 'Doc-powered apps with formulas and automations', 'https://coda.io', ['docs', 'automation']);
  add('Confluence', 'productivity', 'paid', 'Team wiki and knowledge base by Atlassian', 'https://atlassian.com/confluence', ['wiki', 'enterprise']);

  // =========================================================================
  // DEVELOPMENT (20 tools — 10 free, 10 paid)
  // =========================================================================
  add('VS Code', 'development', 'free', 'Lightweight yet powerful code editor with extensions', 'https://code.visualstudio.com', ['editor', 'extensions']);
  add('Git', 'development', 'free', 'Distributed version control system', 'https://git-scm.com', ['version-control', 'cli']);
  add('Node.js', 'development', 'free', 'JavaScript runtime built on V8', 'https://nodejs.org', ['runtime', 'javascript']);
  add('Docker', 'development', 'free', 'Container platform for build, ship, and run', 'https://docker.com', ['containers', 'devops']);
  add('PostgreSQL', 'development', 'free', 'Advanced open-source relational database', 'https://postgresql.org', ['database', 'sql']);
  add('ESLint', 'development', 'free', 'Pluggable JavaScript/TypeScript linter', 'https://eslint.org', ['linter', 'typescript']);
  add('Prettier', 'development', 'free', 'Opinionated code formatter for consistent style', 'https://prettier.io', ['formatter', 'style']);
  add('Vite', 'development', 'free', 'Next-generation frontend build tool', 'https://vitejs.dev', ['bundler', 'hmr']);
  add('Rust', 'development', 'free', 'Memory-safe systems programming language', 'https://rust-lang.org', ['language', 'systems']);
  add('Python', 'development', 'free', 'Versatile high-level programming language', 'https://python.org', ['language', 'scripting']);
  add('GitHub Copilot', 'development', 'paid', 'AI pair-programmer powered by LLMs', 'https://github.com/features/copilot', ['ai', 'autocomplete']);
  add('JetBrains Suite', 'development', 'paid', 'Professional IDEs for every language', 'https://jetbrains.com', ['ide', 'refactoring']);
  add('GitKraken', 'development', 'paid', 'Visual Git client with merge conflict editor', 'https://gitkraken.com', ['git', 'visual']);
  add('Postman Pro', 'development', 'paid', 'API platform with team workspaces and monitoring', 'https://postman.com', ['api', 'testing']);
  add('Datadog', 'development', 'paid', 'Cloud monitoring and observability platform', 'https://datadoghq.com', ['monitoring', 'apm']);
  add('Sentry', 'development', 'paid', 'Application error tracking and performance monitoring', 'https://sentry.io', ['errors', 'performance']);
  add('LaunchDarkly', 'development', 'paid', 'Feature flag management at scale', 'https://launchdarkly.com', ['feature-flags', 'rollout']);
  add('Vercel Pro', 'development', 'paid', 'Frontend deployment with edge functions and analytics', 'https://vercel.com', ['deployment', 'edge']);
  add('CircleCI', 'development', 'paid', 'Continuous integration and delivery platform', 'https://circleci.com', ['ci-cd', 'pipeline']);
  add('Snyk', 'development', 'paid', 'Developer security: find and fix vulnerabilities', 'https://snyk.io', ['security', 'dependencies']);

  // =========================================================================
  // AI / DATA (20 tools — 10 free, 10 paid)
  // =========================================================================
  add('Hugging Face', 'ai-data', 'free', 'Open model hub with transformers library', 'https://huggingface.co', ['models', 'nlp']);
  add('LangChain', 'ai-data', 'free', 'Framework for building LLM-powered applications', 'https://langchain.com', ['llm', 'chains']);
  add('Ollama', 'ai-data', 'free', 'Run open-source LLMs locally', 'https://ollama.ai', ['local-llm', 'inference']);
  add('Jupyter', 'ai-data', 'free', 'Interactive notebooks for data science', 'https://jupyter.org', ['notebooks', 'data-science']);
  add('Pandas', 'ai-data', 'free', 'Data analysis and manipulation library for Python', 'https://pandas.pydata.org', ['dataframes', 'python']);
  add('scikit-learn', 'ai-data', 'free', 'Machine learning library with classical algorithms', 'https://scikit-learn.org', ['ml', 'classification']);
  add('PyTorch', 'ai-data', 'free', 'Neural network framework with dynamic computation graphs', 'https://pytorch.org', ['deep-learning', 'tensors']);
  add('TensorFlow', 'ai-data', 'free', 'End-to-end ML platform by Google', 'https://tensorflow.org', ['deep-learning', 'serving']);
  add('Apache Spark', 'ai-data', 'free', 'Unified analytics engine for big data', 'https://spark.apache.org', ['big-data', 'etl']);
  add('DuckDB', 'ai-data', 'free', 'In-process analytical SQL database', 'https://duckdb.org', ['sql', 'analytics']);
  add('OpenAI API', 'ai-data', 'paid', 'GPT, DALL-E, and Whisper model APIs', 'https://openai.com/api', ['gpt', 'api']);
  add('Anthropic Claude', 'ai-data', 'paid', 'Constitutional AI with long-context models', 'https://anthropic.com', ['llm', 'safety']);
  add('Cohere', 'ai-data', 'paid', 'Enterprise NLP with embeddings and reranking', 'https://cohere.com', ['embeddings', 'enterprise']);
  add('Weights & Biases', 'ai-data', 'paid', 'ML experiment tracking and model registry', 'https://wandb.ai', ['tracking', 'experiments']);
  add('Databricks', 'ai-data', 'paid', 'Lakehouse platform for data and AI', 'https://databricks.com', ['lakehouse', 'spark']);
  add('Scale AI', 'ai-data', 'paid', 'Data labeling and AI infrastructure', 'https://scale.com', ['labeling', 'training-data']);
  add('Pinecone', 'ai-data', 'paid', 'Vector database for similarity search', 'https://pinecone.io', ['vector-db', 'embeddings']);
  add('Snowflake', 'ai-data', 'paid', 'Cloud data warehouse with elastic scaling', 'https://snowflake.com', ['warehouse', 'sql']);
  add('Midjourney', 'ai-data', 'paid', 'AI image generation with artistic style controls', 'https://midjourney.com', ['image-gen', 'art']);
  add('Replicate', 'ai-data', 'paid', 'Run ML models in the cloud via API', 'https://replicate.com', ['inference', 'hosted']);

  // =========================================================================
  // SECURITY (20 tools — 10 free, 10 paid)
  // =========================================================================
  add('Wireshark', 'security', 'free', 'Network protocol analyzer and packet inspector', 'https://wireshark.org', ['network', 'packets']);
  add('Nmap', 'security', 'free', 'Network discovery and security auditing', 'https://nmap.org', ['scanning', 'ports']);
  add('Metasploit Framework', 'security', 'free', 'Penetration testing framework', 'https://metasploit.com', ['pentest', 'exploits']);
  add('OWASP ZAP', 'security', 'free', 'Web application security scanner', 'https://zaproxy.org', ['web-scan', 'vulnerabilities']);
  add('Kali Linux', 'security', 'free', 'Penetration testing Linux distribution', 'https://kali.org', ['distro', 'pentest']);
  add('ClamAV', 'security', 'free', 'Open-source antivirus engine', 'https://clamav.net', ['antivirus', 'malware']);
  add('OpenVPN', 'security', 'free', 'Open-source VPN solution', 'https://openvpn.net', ['vpn', 'tunnel']);
  add('Fail2Ban', 'security', 'free', 'Intrusion prevention via log analysis', 'https://fail2ban.org', ['intrusion', 'banning']);
  add('GnuPG', 'security', 'free', 'OpenPGP encryption and signing', 'https://gnupg.org', ['encryption', 'pgp']);
  add('Suricata', 'security', 'free', 'High-performance IDS/IPS and network security monitoring', 'https://suricata.io', ['ids', 'network']);
  add('Burp Suite Pro', 'security', 'paid', 'Advanced web vulnerability scanner and proxy', 'https://portswigger.net/burp/pro', ['web-scan', 'proxy']);
  add('CrowdStrike', 'security', 'paid', 'Endpoint detection and response platform', 'https://crowdstrike.com', ['edr', 'endpoint']);
  add('Tenable.io', 'security', 'paid', 'Vulnerability management and compliance', 'https://tenable.com', ['vulnerability', 'compliance']);
  add('1Password Teams', 'security', 'paid', 'Enterprise password and secrets management', 'https://1password.com', ['passwords', 'secrets']);
  add('Wiz', 'security', 'paid', 'Cloud-native security posture management', 'https://wiz.io', ['cspm', 'cloud']);
  add('Palo Alto Prisma', 'security', 'paid', 'Cloud-native application protection platform', 'https://paloaltonetworks.com/prisma', ['cnapp', 'cloud']);
  add('Rapid7 InsightVM', 'security', 'paid', 'Live vulnerability and risk management', 'https://rapid7.com', ['vulnerability', 'risk']);
  add('Fortinet FortiGate', 'security', 'paid', 'Next-generation firewall with SD-WAN', 'https://fortinet.com', ['firewall', 'sd-wan']);
  add('SentinelOne', 'security', 'paid', 'Autonomous AI-powered endpoint protection', 'https://sentinelone.com', ['edr', 'ai']);
  add('Checkmarx', 'security', 'paid', 'Static and dynamic application security testing', 'https://checkmarx.com', ['sast', 'dast']);

  // =========================================================================
  // MEDIA / CREATIVE (20 tools — 10 free, 10 paid)
  // =========================================================================
  add('GIMP', 'media-creative', 'free', 'Open-source image editor rivaling Photoshop', 'https://gimp.org', ['image-editor', 'raster']);
  add('Inkscape', 'media-creative', 'free', 'Professional vector graphics editor', 'https://inkscape.org', ['vector', 'svg']);
  add('Blender', 'media-creative', 'free', '3D creation suite: modeling, animation, rendering', 'https://blender.org', ['3d', 'animation']);
  add('Audacity', 'media-creative', 'free', 'Audio editor and recorder', 'https://audacityteam.org', ['audio', 'recording']);
  add('OBS Studio', 'media-creative', 'free', 'Open-source streaming and recording', 'https://obsproject.com', ['streaming', 'recording']);
  add('Kdenlive', 'media-creative', 'free', 'Non-linear video editor', 'https://kdenlive.org', ['video-editor', 'timeline']);
  add('DaVinci Resolve', 'media-creative', 'free', 'Professional video editing and color grading', 'https://blackmagicdesign.com/davinciresolve', ['video-editor', 'color']);
  add('Krita', 'media-creative', 'free', 'Digital painting application for artists', 'https://krita.org', ['painting', 'illustration']);
  add('HandBrake', 'media-creative', 'free', 'Video transcoder for multiple formats', 'https://handbrake.fr', ['transcoding', 'video']);
  add('Shotcut', 'media-creative', 'free', 'Cross-platform video editor with GPU acceleration', 'https://shotcut.org', ['video-editor', 'gpu']);
  add('Adobe Creative Cloud', 'media-creative', 'paid', 'Photoshop, Illustrator, Premiere, After Effects suite', 'https://adobe.com/creativecloud', ['suite', 'professional']);
  add('Final Cut Pro', 'media-creative', 'paid', 'Professional video editing for macOS', 'https://apple.com/final-cut-pro', ['video-editor', 'apple']);
  add('Logic Pro', 'media-creative', 'paid', 'Complete music production studio', 'https://apple.com/logic-pro', ['music', 'daw']);
  add('Ableton Live', 'media-creative', 'paid', 'Music production and live performance DAW', 'https://ableton.com', ['music', 'daw']);
  add('Canva Pro', 'media-creative', 'paid', 'Design platform with templates and brand kit', 'https://canva.com', ['design', 'templates']);
  add('Figma Pro', 'media-creative', 'paid', 'Collaborative UI design tool', 'https://figma.com', ['ui-design', 'prototyping']);
  add('Sketch', 'media-creative', 'paid', 'Vector design toolkit for macOS', 'https://sketch.com', ['ui-design', 'vector']);
  add('Affinity Suite', 'media-creative', 'paid', 'Photo, Designer, Publisher — one-time purchase', 'https://affinity.serif.com', ['photo', 'design']);
  add('Cinema 4D', 'media-creative', 'paid', '3D modeling, animation, and motion graphics', 'https://maxon.net/cinema-4d', ['3d', 'motion']);
  add('Substance 3D', 'media-creative', 'paid', '3D texturing and material creation by Adobe', 'https://adobe.com/products/substance3d', ['texturing', '3d']);

  // =========================================================================
  // SYSTEM UTILITIES (20 tools — 10 free, 10 paid)
  // =========================================================================
  add('htop', 'system-utilities', 'free', 'Interactive process viewer for Unix', 'https://htop.dev', ['process', 'monitor']);
  add('tmux', 'system-utilities', 'free', 'Terminal multiplexer for session management', 'https://github.com/tmux/tmux', ['terminal', 'sessions']);
  add('curl', 'system-utilities', 'free', 'Command-line data transfer tool', 'https://curl.se', ['http', 'cli']);
  add('rsync', 'system-utilities', 'free', 'Fast incremental file sync', 'https://rsync.samba.org', ['sync', 'backup']);
  add('7-Zip', 'system-utilities', 'free', 'High-compression file archiver', 'https://7-zip.org', ['compression', 'archive']);
  add('VirtualBox', 'system-utilities', 'free', 'Cross-platform virtualization', 'https://virtualbox.org', ['vm', 'virtualization']);
  add('WinSCP', 'system-utilities', 'free', 'SFTP and FTP client for Windows', 'https://winscp.net', ['sftp', 'transfer']);
  add('BleachBit', 'system-utilities', 'free', 'System cleaner and privacy tool', 'https://bleachbit.org', ['cleaner', 'privacy']);
  add('Sysinternals', 'system-utilities', 'free', 'Advanced system utilities for Windows by Microsoft', 'https://docs.microsoft.com/en-us/sysinternals', ['windows', 'diagnostics']);
  add('Ventoy', 'system-utilities', 'free', 'Bootable USB solution for multiple ISOs', 'https://ventoy.net', ['usb', 'bootable']);
  add('VMware Workstation', 'system-utilities', 'paid', 'Professional desktop virtualization', 'https://vmware.com/products/workstation', ['vm', 'professional']);
  add('Parallels Desktop', 'system-utilities', 'paid', 'Run Windows on Mac seamlessly', 'https://parallels.com', ['vm', 'macos']);
  add('Acronis Cyber Protect', 'system-utilities', 'paid', 'Backup, disaster recovery, and anti-malware', 'https://acronis.com', ['backup', 'disaster-recovery']);
  add('ESET NOD32', 'system-utilities', 'paid', 'Lightweight antivirus with anti-phishing', 'https://eset.com', ['antivirus', 'protection']);
  add('CCleaner Pro', 'system-utilities', 'paid', 'PC optimization and cleaning suite', 'https://ccleaner.com', ['cleaner', 'optimization']);
  add('WinRAR', 'system-utilities', 'paid', 'Archive manager with RAR/ZIP support', 'https://rarlab.com', ['compression', 'archive']);
  add('Directory Opus', 'system-utilities', 'paid', 'Advanced file manager for Windows', 'https://gpsoft.com.au', ['file-manager', 'windows']);
  add('iStat Menus', 'system-utilities', 'paid', 'macOS system monitoring in the menu bar', 'https://bjango.com/mac/istatmenus', ['monitor', 'macos']);
  add('Fences', 'system-utilities', 'paid', 'Desktop icon organization by Stardock', 'https://stardock.com/products/fences', ['desktop', 'organization']);
  add('MobaXterm', 'system-utilities', 'paid', 'Enhanced terminal for Windows with X server', 'https://mobaxterm.mobatek.net', ['terminal', 'ssh']);

  // =========================================================================
  // BROWSERS / COMMUNICATION (20 tools — 10 free, 10 paid)
  // =========================================================================
  add('Firefox', 'browsers-communication', 'free', 'Privacy-focused open-source web browser', 'https://firefox.com', ['browser', 'privacy']);
  add('Brave', 'browsers-communication', 'free', 'Browser with built-in ad blocking and privacy', 'https://brave.com', ['browser', 'ad-block']);
  add('Thunderbird', 'browsers-communication', 'free', 'Open-source email client by Mozilla', 'https://thunderbird.net', ['email', 'calendar']);
  add('Signal', 'browsers-communication', 'free', 'End-to-end encrypted messaging', 'https://signal.org', ['messaging', 'encryption']);
  add('Element', 'browsers-communication', 'free', 'Matrix-based decentralized chat', 'https://element.io', ['chat', 'decentralized']);
  add('Jitsi Meet', 'browsers-communication', 'free', 'Open-source video conferencing', 'https://meet.jit.si', ['video', 'conference']);
  add('Discord', 'browsers-communication', 'free', 'Voice, video, and text chat for communities', 'https://discord.com', ['chat', 'voice']);
  add('Mattermost', 'browsers-communication', 'free', 'Open-source team messaging and collaboration', 'https://mattermost.com', ['messaging', 'team']);
  add('Telegram', 'browsers-communication', 'free', 'Cloud-based messaging with channels and bots', 'https://telegram.org', ['messaging', 'bots']);
  add('Zulip', 'browsers-communication', 'free', 'Threaded team chat for productive conversations', 'https://zulip.com', ['chat', 'threading']);
  add('Slack Pro', 'browsers-communication', 'paid', 'Team messaging with apps, workflows, and archives', 'https://slack.com', ['messaging', 'workflow']);
  add('Microsoft Teams', 'browsers-communication', 'paid', 'Meetings, chat, and apps in one workspace', 'https://microsoft.com/teams', ['video', 'collaboration']);
  add('Zoom Pro', 'browsers-communication', 'paid', 'Video conferencing with breakout rooms and webinars', 'https://zoom.us', ['video', 'webinars']);
  add('Google Workspace', 'browsers-communication', 'paid', 'Gmail, Calendar, Drive, Meet for business', 'https://workspace.google.com', ['email', 'suite']);
  add('Front', 'browsers-communication', 'paid', 'Shared inbox and customer communication hub', 'https://front.com', ['inbox', 'support']);
  add('Intercom', 'browsers-communication', 'paid', 'Customer messaging platform with bots and tours', 'https://intercom.com', ['support', 'chatbot']);
  add('Loom', 'browsers-communication', 'paid', 'Async video messaging for teams', 'https://loom.com', ['video', 'async']);
  add('Calendly', 'browsers-communication', 'paid', 'Scheduling automation for meetings', 'https://calendly.com', ['scheduling', 'calendar']);
  add('Webex Enterprise', 'browsers-communication', 'paid', 'Enterprise video conferencing by Cisco', 'https://webex.com', ['video', 'enterprise']);
  add('RingCentral', 'browsers-communication', 'paid', 'Unified communications: phone, video, messaging', 'https://ringcentral.com', ['phone', 'unified']);

  // =========================================================================
  // DESIGN / UX (20 tools — 10 free, 10 paid)
  // =========================================================================
  add('Penpot', 'design-ux', 'free', 'Open-source design and prototyping platform', 'https://penpot.app', ['prototyping', 'open-source']);
  add('Lunacy', 'design-ux', 'free', 'Free graphic design app with built-in assets', 'https://icons8.com/lunacy', ['design', 'assets']);
  add('Pencil Project', 'design-ux', 'free', 'GUI prototyping and wireframing', 'https://pencil.evolus.vn', ['wireframe', 'prototyping']);
  add('Diagrams.net', 'design-ux', 'free', 'Diagramming tool (formerly draw.io)', 'https://diagrams.net', ['diagrams', 'flowcharts']);
  add('Storybook', 'design-ux', 'free', 'UI component explorer for frontend dev', 'https://storybook.js.org', ['components', 'ui']);
  add('Excalidraw', 'design-ux', 'free', 'Whiteboard-style diagramming with hand-drawn feel', 'https://excalidraw.com', ['whiteboard', 'sketching']);
  add('Wireframe.cc', 'design-ux', 'free', 'Minimal wireframing tool in the browser', 'https://wireframe.cc', ['wireframe', 'minimal']);
  add('Color Hunt', 'design-ux', 'free', 'Curated color palette inspiration', 'https://colorhunt.co', ['colors', 'palette']);
  add('Font Awesome', 'design-ux', 'free', 'Icon toolkit with thousands of free icons', 'https://fontawesome.com', ['icons', 'toolkit']);
  add('Google Fonts', 'design-ux', 'free', 'Free web font library by Google', 'https://fonts.google.com', ['fonts', 'typography']);
  add('Figma Organization', 'design-ux', 'paid', 'Design system at scale with shared libraries', 'https://figma.com', ['design-system', 'enterprise']);
  add('Abstract', 'design-ux', 'paid', 'Version control and collaboration for Sketch files', 'https://abstract.com', ['version-control', 'sketch']);
  add('InVision', 'design-ux', 'paid', 'Prototyping and design collaboration platform', 'https://invisionapp.com', ['prototyping', 'collaboration']);
  add('Zeplin', 'design-ux', 'paid', 'Design-to-developer handoff and style guides', 'https://zeplin.io', ['handoff', 'specs']);
  add('Maze', 'design-ux', 'paid', 'Rapid usability testing for prototypes', 'https://maze.co', ['usability', 'testing']);
  add('UserTesting', 'design-ux', 'paid', 'On-demand human insight platform', 'https://usertesting.com', ['ux-research', 'interviews']);
  add('Axure RP', 'design-ux', 'paid', 'Advanced wireframing and interactive prototyping', 'https://axure.com', ['prototyping', 'advanced']);
  add('Principle', 'design-ux', 'paid', 'Animated UI design tool for macOS', 'https://principleformac.com', ['animation', 'transitions']);
  add('ProtoPie', 'design-ux', 'paid', 'High-fidelity interactive prototyping', 'https://protopie.io', ['prototyping', 'interactive']);
  add('Framer', 'design-ux', 'paid', 'Design-to-production website builder', 'https://framer.com', ['websites', 'no-code']);

  // =========================================================================
  // ENTERPRISE (20 tools — 10 free, 10 paid)
  // =========================================================================
  add('Grafana', 'enterprise', 'free', 'Open-source analytics and monitoring dashboards', 'https://grafana.com', ['dashboards', 'monitoring']);
  add('Prometheus', 'enterprise', 'free', 'Metrics collection and alerting toolkit', 'https://prometheus.io', ['metrics', 'alerting']);
  add('Keycloak', 'enterprise', 'free', 'Open-source identity and access management', 'https://keycloak.org', ['iam', 'sso']);
  add('MinIO', 'enterprise', 'free', 'High-performance S3-compatible object storage', 'https://min.io', ['storage', 's3']);
  add('Apache Kafka', 'enterprise', 'free', 'Distributed event streaming platform', 'https://kafka.apache.org', ['streaming', 'events']);
  add('Elasticsearch', 'enterprise', 'free', 'Distributed search and analytics engine', 'https://elastic.co', ['search', 'analytics']);
  add('Terraform', 'enterprise', 'free', 'Infrastructure as code for multi-cloud', 'https://terraform.io', ['iac', 'multi-cloud']);
  add('Ansible', 'enterprise', 'free', 'Automation for config management and deployment', 'https://ansible.com', ['automation', 'config']);
  add('Kong Gateway', 'enterprise', 'free', 'Cloud-native API gateway', 'https://konghq.com', ['api-gateway', 'microservices']);
  add('Harbor', 'enterprise', 'free', 'Open-source container image registry', 'https://goharbor.io', ['registry', 'containers']);
  add('Splunk Enterprise', 'enterprise', 'paid', 'Data analytics and SIEM platform', 'https://splunk.com', ['siem', 'analytics']);
  add('PagerDuty', 'enterprise', 'paid', 'Incident management and on-call scheduling', 'https://pagerduty.com', ['incidents', 'on-call']);
  add('ServiceNow', 'enterprise', 'paid', 'Digital workflows for IT and business', 'https://servicenow.com', ['itsm', 'workflows']);
  add('Okta', 'enterprise', 'paid', 'Enterprise identity and access management', 'https://okta.com', ['iam', 'sso']);
  add('HashiCorp Vault', 'enterprise', 'paid', 'Secrets management and data protection', 'https://vaultproject.io', ['secrets', 'encryption']);
  add('New Relic', 'enterprise', 'paid', 'Full-stack observability platform', 'https://newrelic.com', ['observability', 'apm']);
  add('Salesforce', 'enterprise', 'paid', 'CRM platform for sales, service, and marketing', 'https://salesforce.com', ['crm', 'sales']);
  add('SAP S/4HANA', 'enterprise', 'paid', 'Intelligent ERP for enterprise operations', 'https://sap.com/s4hana', ['erp', 'finance']);
  add('Atlassian Jira', 'enterprise', 'paid', 'Issue tracking and agile project management', 'https://atlassian.com/jira', ['agile', 'issues']);
  add('AWS CloudFormation', 'enterprise', 'paid', 'Infrastructure as code for AWS', 'https://aws.amazon.com/cloudformation', ['iac', 'aws']);

  // =========================================================================
  // SPECIALIZED (20 tools — 10 free, 10 paid)
  // =========================================================================
  add('Godot', 'specialized', 'free', 'Open-source game engine with GDScript and C#', 'https://godotengine.org', ['game-engine', 'gdscript']);
  add('Arduino IDE', 'specialized', 'free', 'Development environment for Arduino boards', 'https://arduino.cc', ['iot', 'embedded']);
  add('QGIS', 'specialized', 'free', 'Geographic information system for spatial analysis', 'https://qgis.org', ['gis', 'mapping']);
  add('OpenSCAD', 'specialized', 'free', 'Programmable 3D CAD modeler', 'https://openscad.org', ['cad', '3d-printing']);
  add('Wireshark Profiles', 'specialized', 'free', 'Custom packet analysis profiles for protocol work', 'https://wireshark.org', ['network', 'protocol']);
  add('Ghidra', 'specialized', 'free', 'Reverse engineering framework by NSA', 'https://ghidra-sre.org', ['reverse-engineering', 'binary']);
  add('FreeCAD', 'specialized', 'free', 'Parametric 3D CAD modeler for engineering', 'https://freecad.org', ['cad', 'engineering']);
  add('GNU Radio', 'specialized', 'free', 'Software-defined radio toolkit', 'https://gnuradio.org', ['sdr', 'radio']);
  add('ROS 2', 'specialized', 'free', 'Robot Operating System for robotics development', 'https://ros.org', ['robotics', 'middleware']);
  add('KiCad', 'specialized', 'free', 'Open-source PCB design and schematic capture', 'https://kicad.org', ['pcb', 'electronics']);
  add('Unity Pro', 'specialized', 'paid', 'Game engine with professional tools and analytics', 'https://unity.com', ['game-engine', 'xr']);
  add('Unreal Engine Enterprise', 'specialized', 'paid', 'Photorealistic game and simulation engine', 'https://unrealengine.com', ['game-engine', 'simulation']);
  add('MATLAB', 'specialized', 'paid', 'Numerical computing and algorithm development', 'https://mathworks.com/products/matlab', ['math', 'simulation']);
  add('Mathematica', 'specialized', 'paid', 'Computational intelligence platform by Wolfram', 'https://wolfram.com/mathematica', ['math', 'symbolic']);
  add('SolidWorks', 'specialized', 'paid', '3D CAD design for mechanical engineering', 'https://solidworks.com', ['cad', 'mechanical']);
  add('AutoCAD', 'specialized', 'paid', 'Industry-standard 2D/3D CAD by Autodesk', 'https://autodesk.com/autocad', ['cad', 'drafting']);
  add('LabVIEW', 'specialized', 'paid', 'Graphical programming for test and measurement', 'https://ni.com/labview', ['test', 'graphical']);
  add('Tableau', 'specialized', 'paid', 'Data visualization and business intelligence', 'https://tableau.com', ['visualization', 'bi']);
  add('ArcGIS Pro', 'specialized', 'paid', 'Professional GIS by Esri', 'https://esri.com/arcgis', ['gis', 'enterprise']);
  add('Altium Designer', 'specialized', 'paid', 'Professional PCB design and documentation', 'https://altium.com', ['pcb', 'professional']);

  return tools;
}

// ---------------------------------------------------------------------------
// ArsenalToolkit class
// ---------------------------------------------------------------------------

export class ArsenalToolkit {
  private readonly catalog: ArsenalTool[];
  private listeners: Array<(e: ArsenalEvent) => void>;
  private events: ArsenalEvent[];

  constructor() {
    this.catalog = buildCatalog();
    this.listeners = [];
    this.events = [];
  }

  // ------------------------------------------------------------------
  // Event system
  // ------------------------------------------------------------------

  public on(listener: (e: ArsenalEvent) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private emit(event: ArsenalEvent): void {
    this.events.push(event);
    for (const l of this.listeners) {
      l(event);
    }
  }

  // ------------------------------------------------------------------
  // Querying
  // ------------------------------------------------------------------

  /** Get all 200 tools. */
  public getAll(): ReadonlyArray<ArsenalTool> {
    return this.catalog;
  }

  /** Get tool by ID. */
  public getById(id: number): ArsenalTool | undefined {
    return this.catalog.find(t => t.id === id);
  }

  /** Get tool by exact name (case-insensitive). */
  public getByName(name: string): ArsenalTool | undefined {
    const lower = name.toLowerCase();
    return this.catalog.find(t => t.name.toLowerCase() === lower);
  }

  /** Filter tools by multiple criteria. */
  public filter(f: ArsenalFilter): ArsenalTool[] {
    return this.catalog.filter(tool => {
      if (f.category && tool.category !== f.category) return false;
      if (f.tier && tool.tier !== f.tier) return false;
      if (f.minRating !== undefined && tool.rating < f.minRating) return false;
      if (f.tags && f.tags.length > 0) {
        const hasAny = f.tags.some(tag =>
          tool.tags.includes(tag),
        );
        if (!hasAny) return false;
      }
      if (f.searchText) {
        const text = f.searchText.toLowerCase();
        const haystack = (tool.name + ' ' + tool.description + ' ' + tool.tags.join(' ')).toLowerCase();
        if (!haystack.includes(text)) return false;
      }
      return true;
    });
  }

  /** Full-text search across name, description, and tags. */
  public search(query: string): ArsenalTool[] {
    this.emit({
      kind: 'search',
      toolId: null,
      toolName: query,
      timestamp: Date.now(),
      payload: { query },
    });
    return this.filter({ searchText: query });
  }

  /** Get all tools in a category. */
  public getByCategory(cat: ArsenalCategory): ArsenalTool[] {
    return this.catalog.filter(t => t.category === cat);
  }

  /** Get all free tools. */
  public getFreeTools(): ArsenalTool[] {
    return this.catalog.filter(t => t.tier === 'free');
  }

  /** Get all paid tools. */
  public getPaidTools(): ArsenalTool[] {
    return this.catalog.filter(t => t.tier === 'paid');
  }

  /** Get top-rated tools. */
  public getTopRated(limit: number = 10): ArsenalTool[] {
    return this.catalog
      .slice()
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);
  }

  /** Get most-used tools. */
  public getMostUsed(limit: number = 10): ArsenalTool[] {
    return this.catalog
      .slice()
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  }

  // ------------------------------------------------------------------
  // Category analytics
  // ------------------------------------------------------------------

  /** Count tools per category. */
  public getCategoryCounts(): Record<ArsenalCategory, number> {
    const counts: Record<string, number> = {};
    for (const tool of this.catalog) {
      counts[tool.category] = (counts[tool.category] ?? 0) + 1;
    }
    return counts as Record<ArsenalCategory, number>;
  }

  /** Get all distinct tags. */
  public getAllTags(): string[] {
    const tagSet = new Set<string>();
    for (const tool of this.catalog) {
      for (const tag of tool.tags) {
        tagSet.add(tag);
      }
    }
    return Array.from(tagSet).sort();
  }

  // ------------------------------------------------------------------
  // Usage tracking
  // ------------------------------------------------------------------

  /** Record that a tool was used. */
  public useTool(id: number): ArsenalTool | undefined {
    const tool = this.catalog.find(t => t.id === id);
    if (!tool) return undefined;
    if (!tool.licensed) return undefined; // must be licensed
    tool.usageCount++;
    this.emit({
      kind: 'tool-used',
      toolId: tool.id,
      toolName: tool.name,
      timestamp: Date.now(),
      payload: { tier: tool.tier, category: tool.category },
    });
    return tool;
  }

  // ------------------------------------------------------------------
  // Licensing
  // ------------------------------------------------------------------

  /** Grant a paid-tool license. */
  public licenseTool(id: number): boolean {
    const tool = this.catalog.find(t => t.id === id);
    if (!tool) return false;
    tool.licensed = true;
    this.emit({
      kind: 'tool-licensed',
      toolId: tool.id,
      toolName: tool.name,
      timestamp: Date.now(),
      payload: { tier: tool.tier },
    });
    return true;
  }

  /** Revoke a paid-tool license (free tools stay licensed). */
  public revokeLicense(id: number): boolean {
    const tool = this.catalog.find(t => t.id === id);
    if (!tool || tool.tier === 'free') return false;
    tool.licensed = false;
    return true;
  }

  /** Get all currently licensed paid tools. */
  public getLicensedPaidTools(): ArsenalTool[] {
    return this.catalog.filter(t => t.tier === 'paid' && t.licensed);
  }

  // ------------------------------------------------------------------
  // Summary (for TSU wiring)
  // ------------------------------------------------------------------

  public getSummary(): ArsenalSummary {
    const freeCount = this.catalog.filter(t => t.tier === 'free').length;
    const paidCount = this.catalog.filter(t => t.tier === 'paid').length;
    const licensedCount = this.catalog.filter(t => t.licensed).length;
    const totalUsage = this.catalog.reduce((sum, t) => sum + t.usageCount, 0);
    const avgRating = this.catalog.reduce((sum, t) => sum + t.rating, 0) / this.catalog.length;

    // Determine top category by tool count
    const counts = this.getCategoryCounts();
    let topCat = 'productivity';
    let topCount = 0;
    const categoryKeys = Object.keys(counts) as ArsenalCategory[];
    for (const cat of categoryKeys) {
      if (counts[cat] > topCount) {
        topCount = counts[cat];
        topCat = cat;
      }
    }

    return {
      totalTools: this.catalog.length,
      freeTools: freeCount,
      paidTools: paidCount,
      categories: categoryKeys.length,
      licensedTools: licensedCount,
      totalUsage,
      topCategory: topCat,
      averageRating: Number.parseFloat(avgRating.toFixed(2)),
      eventCount: this.events.length,
    };
  }
}
