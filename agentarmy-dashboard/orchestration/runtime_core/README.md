
# AgentArmy Runtime Core

This directory contains the modular, extensible runtime kernel for AgentArmy. It provides the integration contracts and OS-level loop for all major subsystems:

- **Swarm Intelligence Engine**
- **Defensive Intelligence Subsystem**
- **Root-Owner Governance Console**
- **QubitCoin Economic Engine**
- **Agent Orchestration Core**



## Core Modules

- `universal_agent_interface.py` — Universal contract for all agents/subsystems
- `event_bus.py` — Decoupled event system for subsystem communication
- `agent_registry.py` — Central registry for agent/subsystem discovery
- `runtime_orchestrator.py` — OS-level integration loop
- `bootstrap.py` — Entry point to start the AgentArmy OS
- `api.py` — FastAPI layer exposing runtime to the dashboard
- `adapters/` — Plug-in adapters for all major agent frameworks:
	- `openai_agent_adapter.py` (OpenAI Agents SDK)
	- `google_adk_adapter.py` (Google ADK)
	- `dify_adapter.py` (Dify)
	- `autogpt_adapter.py` (AutoGPT)
	- `rasa_adapter.py` (Rasa)
	- `botpress_adapter.py` (BotPress)
	- `devin_ai_adapter.py` (Devin AI)
	- `chatgpt_agent_adapter.py` (ChatGPT Agent)
	- `adeptia_connect_adapter.py` (Adeptia Connect)
	- `boomi_atomsphere_adapter.py` (Boomi AtomSphere)
	- `integratorio_adapter.py` (Integrator.io / Celigo)
	- `api2cart_adapter.py` (API2Cart)
	- `dell_boomi_adapter.py` (Dell Boomi)
	- `cleo_adapter.py` (Cleo Integration Cloud)
	- `cyclr_adapter.py` (Cyclr iPaaS)
	- `denodo_adapter.py` (Denodo Platform)
	- `equalum_adapter.py` (Equalum)
	- `fivetran_adapter.py` (Fivetran)
	- `pentaho_adapter.py` (Hitachi Vantara Pentaho)
	- `hvr_adapter.py` (HVR Software)
	- `ibm_infosphere_adapter.py` (IBM InfoSphere)
	- `informatica_adapter.py` (Informatica Intelligent Data Platform)
	- `jitterbit_adapter.py` (Jitterbit Harmony)
	- `keboola_adapter.py` (Keboola)
	- `matillion_adapter.py` (Matillion ETL)
	- `microsoft_ssis_adapter.py` (Microsoft SSIS)
	- `cisco_packet_tracer_adapter.py` (Cisco Packet Tracer)
	- `gns3_adapter.py` (GNS3)
	- `eve_ng_adapter.py` (EVE-NG)
	- `wireshark_adapter.py` (Wireshark)
	- `putty_adapter.py` (PuTTY)
	- `securecrt_adapter.py` (SecureCRT)
	- `mobaxterm_adapter.py` (MobaXterm)
	- `solarwinds_adapter.py` (SolarWinds)
	- `zabbix_adapter.py` (Zabbix)
	- `nessus_adapter.py` (Nessus)
	- `openvas_adapter.py` (OpenVAS)
	- `n8n_adapter.py` (n8n Workflow Automation)
	- `frigate_nvr_adapter.py` (Frigate NVR)
	- `ansible_adapter.py` (Ansible)
	- `docker_mcp_adapter.py` (Docker MCP)
	- `telos_adapter.py` (Telos)
	- `claude_code_adapter.py` (Claude Code)
	- `ai_in_the_terminal_adapter.py` (AI-in-the-terminal)
	- `mac_studio_cluster_adapter.py` (Mac Studio Cluster)
	- `simplelogin_adapter.py` (SimpleLogin)
	- `nodejs_goof_adapter.py` (Nodejs-goof)
**Network/Automation/Security/Community Integrations:**
- **Cisco Packet Tracer**: Registered as `cisco_packet_tracer` for network simulation
- **GNS3**: Registered as `gns3` for network simulation
- **EVE-NG**: Registered as `eve_ng` for network simulation
- **Wireshark**: Registered as `wireshark` for packet capture/analysis
- **PuTTY**: Registered as `putty` for secure terminal access
- **SecureCRT**: Registered as `securecrt` for secure terminal access
- **MobaXterm**: Registered as `mobaxterm` for secure terminal access
- **SolarWinds**: Registered as `solarwinds` for network monitoring
- **Zabbix**: Registered as `zabbix` for network monitoring
- **Nessus**: Registered as `nessus` for vulnerability scanning
- **OpenVAS**: Registered as `openvas` for vulnerability scanning
- **n8n**: Registered as `n8n` for workflow automation
- **Frigate NVR**: Registered as `frigate_nvr` for AI surveillance/camera automation
- **Ansible**: Registered as `ansible` for network/server automation
- **Docker MCP**: Registered as `docker_mcp` for container orchestration
- **Telos**: Registered as `telos` for network automation utility
- **Claude Code**: Registered as `claude_code` for AI code/voice automation
- **AI-in-the-terminal**: Registered as `ai_in_the_terminal` for AI CLI workflows
- **Mac Studio Cluster**: Registered as `mac_studio_cluster` for AI compute orchestration
- **SimpleLogin**: Registered as `simplelogin` for email automation/security
- **Nodejs-goof**: Registered as `nodejs_goof` for security/vulnerability demo



## Integration Architecture

All subsystems and adapters implement `UniversalAgentInterface` and are registered with the orchestrator. The event bus enables decoupled communication. The registry provides discovery and management. The orchestrator manages the runtime loop, calling governance, defensive, and economic hooks for real-time intervention and incentives.

**Strategic Integration:**
- **OpenAI Agents SDK**: Registered as `openai_planner` for advanced planning and LLM tasks
- **Devin AI**: Registered as `devin_coder` for autonomous coding and build tasks
- **Rasa**: Registered as `rasa_chat` for conversational and NLU tasks
- **BotPress**: Registered as `botpress_nlp` for NLP and workflow automation
- **Dify**: Registered as `dify_tool` for tool-augmented agent actions
- **AutoGPT**: Registered as `autogpt_researcher` for autonomous research and multi-step reasoning
- **Google ADK**: Registered as `google_adk_connector` for Google ecosystem integration
- **ChatGPT Agent**: Registered as `chatgpt_agent` for general chat and assistant tasks
 

**Enterprise/Automation Integration:**
- **Adeptia Connect**: Registered as `adeptia_integration` for enterprise data integration
- **Boomi AtomSphere**: Registered as `boomi_atomsphere` for cloud/on-prem automation
- **Integrator.io (Celigo)**: Registered as `integrator_io` for app/process automation
- **API2Cart**: Registered as `api2cart` for eCommerce integration
- **Dell Boomi**: Registered as `dell_boomi` for data integration and automation
- **Cleo Integration Cloud**: Registered as `cleo_integration` for B2B and SaaS data flows
- **Cyclr iPaaS**: Registered as `cyclr_integration` for embedded/white-label integrations
- **Denodo Platform**: Registered as `denodo_integration` for data virtualization and delivery
- **Equalum**: Registered as `equalum_integration` for batch/streaming pipelines
- **Fivetran**: Registered as `fivetran_integration` for automated connectors and ETL
- **Hitachi Vantara Pentaho**: Registered as `pentaho_integration` for analytics and big data
- **HVR Software**: Registered as `hvr_integration` for high-volume replication
- **IBM InfoSphere**: Registered as `ibm_infosphere_integration` for enterprise data integration
- **Informatica Intelligent Data Platform**: Registered as `informatica_integration` for hybrid/cloud data management
- **Jitterbit Harmony**: Registered as `jitterbit_integration` for cloud/hybrid API and data integration
- **Keboola**: Registered as `keboola_integration` for cloud data workflows
- **Matillion ETL**: Registered as `matillion_integration` for cloud-native ETL/ELT
- **Microsoft SSIS**: Registered as `microsoft_ssis_integration` for on-prem/cloud ETL

All adapters are orchestrated, event-driven, and observable from the dashboard, enabling AgentArmy to unify AI, automation, and enterprise data flows.

All adapters are attached to the event bus and can be orchestrated, observed, and controlled from the dashboard.


## Next Steps
- Expand API endpoints for full dashboard control (view agents, send tasks, override, kill, etc.)
- Build integration and contract compliance tests
- Connect dashboard UI to API for live root-owner control
