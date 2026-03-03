from ..frameworks.slack_trigger import SlackTrigger
from .ai_suggestion import AISuggestionEngine
from .self_healing import SelfHealingEngine
from .tool_marketplace import ToolMarketplace
# More adapters from NetworkChuck tools
from .adapters.claude_code_adapter import ClaudeCodeAdapter
from .adapters.ai_in_the_terminal_adapter import AIInTheTerminalAdapter
from .adapters.mac_studio_cluster_adapter import MacStudioClusterAdapter
from .adapters.simplelogin_adapter import SimpleLoginAdapter
from .adapters.nodejs_goof_adapter import NodejsGoofAdapter
# Additional automation adapters
from .adapters.n8n_adapter import N8nAdapter
from .adapters.frigate_nvr_adapter import FrigateNVRAdapter
from .adapters.ansible_adapter import AnsibleAdapter
from .adapters.docker_mcp_adapter import DockerMCPAdapter
from .adapters.telos_adapter import TelosAdapter
# Network tools adapters
from .adapters.cisco_packet_tracer_adapter import CiscoPacketTracerAdapter
from .adapters.gns3_adapter import GNS3Adapter
from .adapters.eve_ng_adapter import EVENgAdapter
from .adapters.wireshark_adapter import WiresharkAdapter
from .adapters.putty_adapter import PuttyAdapter
from .adapters.securecrt_adapter import SecureCRTAdapter
from .adapters.mobaxterm_adapter import MobaXtermAdapter
from .adapters.solarwinds_adapter import SolarWindsAdapter
from .adapters.zabbix_adapter import ZabbixAdapter
from .adapters.nessus_adapter import NessusAdapter
from .adapters.openvas_adapter import OpenVASAdapter
# Enterprise/automation adapters

# Enterprise/automation adapters
from .adapters.adeptia_connect_adapter import AdeptiaConnectAdapter
from .adapters.boomi_atomsphere_adapter import BoomiAtomSphereAdapter
from .adapters.integratorio_adapter import IntegratorIOAdapter
from .adapters.api2cart_adapter import API2CartAdapter
from .adapters.dell_boomi_adapter import DellBoomiAdapter
from .adapters.cleo_adapter import CleoAdapter
from .adapters.cyclr_adapter import CyclrAdapter
from .adapters.denodo_adapter import DenodoAdapter
from .adapters.equalum_adapter import EqualumAdapter
from .adapters.fivetran_adapter import FivetranAdapter
from .adapters.pentaho_adapter import PentahoAdapter
from .adapters.hvr_adapter import HVRAdapter
from .adapters.ibm_infosphere_adapter import IBMInfoSphereAdapter
from .adapters.informatica_adapter import InformaticaAdapter
from .adapters.jitterbit_adapter import JitterbitAdapter
from .adapters.keboola_adapter import KeboolaAdapter
from .adapters.matillion_adapter import MatillionAdapter
from .adapters.microsoft_ssis_adapter import MicrosoftSSISAdapter
"""
Runtime Orchestrator for AgentArmy Runtime Core
----------------------------------------------
The OS-level integration loop connecting registry, event bus, and all subsystems.
"""

from contextlib import suppress

# EducationCenter is optional (handles broken indentation or missing file gracefully)
EducationCenter = None
with suppress(ImportError, IndentationError):
    try:
        from ..education_center.education_center import EducationCenter
    except (ImportError, IndentationError):
        # This might be run from a different path in some contexts
        from education_center.education_center import EducationCenter

# Workflow engine
from .workflow_engine import WorkflowEngine, WorkflowStep
from .event_bus import EventBus, Event
from .agent_registry import AgentRegistry
from .universal_agent_interface import UniversalAgentInterface
# from .swarm_subsystem import SwarmSubsystem
# from .defensive_subsystem import DefensiveSubsystem
# from .governance_subsystem import GovernanceSubsystem
# from .economic_subsystem import EconomicSubsystem
# External agent adapters
from .adapters.openai_agent_adapter import OpenAIAgentAdapter
from .adapters.google_adk_adapter import GoogleADKAgentAdapter
from .adapters.dify_adapter import DifyAgentAdapter
from .adapters.autogpt_adapter import AutoGPTAgentAdapter
from .adapters.rasa_adapter import RasaAgentAdapter
from .adapters.botpress_adapter import BotPressAgentAdapter
from .adapters.devin_ai_adapter import DevinAIAgentAdapter
from .adapters.chatgpt_agent_adapter import ChatGPTAgentAdapter
from typing import Optional


class RuntimeOrchestrator:
    def __init__(self, registry: Optional[AgentRegistry] = None, event_bus: Optional[EventBus] = None):
        self.registry = registry or AgentRegistry()
        self.event_bus = event_bus or EventBus()
        self.domains = {}
        self.running = False

        # Workflow engine
        self.workflow_engine = WorkflowEngine(self.registry, self.event_bus)

        # Instantiate and register all core subsystems (commented out: abstract classes)
        # self.swarm = SwarmSubsystem()
        # self.defensive = DefensiveSubsystem()
        # self.governance = GovernanceSubsystem()
        # self.economic = EconomicSubsystem()

        # self.register_agent("swarm", self.swarm)
        # self.register_agent("defensive", self.defensive)
        # self.register_agent("governance", self.governance)
        # self.register_agent("economic", self.economic)

        # Register EducationCenter as a first-class domain
        if EducationCenter:
            try:
                self.education_center = EducationCenter(self)
                self.register_agent("education_center", self.education_center)
            except Exception as e:
                print(f"[RuntimeOrchestrator] EducationCenter registration failed: {e}")
        else:
            self.education_center = None

        # Register SlackTrigger for Slack event workflows
        self.slack_trigger = SlackTrigger(self)

        # Register SlackEchoAgent for mind-blowing Slack event demo
        try:
            # from ..agents.slack_echo_agent import SlackEchoAgent
            # self.slack_echo_agent = SlackEchoAgent(self.event_bus)
            # self.register_agent("slack_echo_agent", self.slack_echo_agent)
            pass
            pass
            pass
            pass
        except Exception as e:
            print(f"[RuntimeOrchestrator] SlackEchoAgent registration failed: {e}")

        # Register additional event-driven agents for all channels and workflows
        try:
            from ..agents.email_agent import EmailAgent
            from ..agents.webhook_agent import WebhookAgent
            from ..agents.iot_agent import IoTAgent
            from ..agents.learning_workflow_agent import LearningWorkflowAgent
            from ..agents.event_logger_agent import EventLoggerAgent
            from ..agents.policy_enforcer_agent import PolicyEnforcerAgent

            self.email_agent = EmailAgent(self.event_bus)
            self.webhook_agent = WebhookAgent(self.event_bus)
            self.iot_agent = IoTAgent(self.event_bus)
            self.event_logger_agent = EventLoggerAgent(self.event_bus)
            self.policy_enforcer_agent = PolicyEnforcerAgent(self.event_bus, self.governance)

            # LearningWorkflowAgent needs subsystem references
            # (Assumes EducationCenter is available as self.education_center)
            education_center = getattr(self, 'education_center', None)
            self.learning_workflow_agent = LearningWorkflowAgent(
                self.event_bus, education_center, self.governance, self.economic
            )

            self.register_agent("email_agent", self.email_agent)
            self.register_agent("webhook_agent", self.webhook_agent)
            self.register_agent("iot_agent", self.iot_agent)
            self.register_agent("event_logger_agent", self.event_logger_agent)
            self.register_agent("policy_enforcer_agent", self.policy_enforcer_agent)
            self.register_agent("learning_workflow_agent", self.learning_workflow_agent)
        except Exception as e:
            print(f"[RuntimeOrchestrator] Event-driven agent registration failed: {e}")

        # AI-powered suggestion and self-healing
        self.tool_marketplace = ToolMarketplace(self.registry, self.event_bus)
        self.ai_suggestion = AISuggestionEngine(self.tool_marketplace, self.workflow_engine)
        self.self_healing = SelfHealingEngine(self.registry)

        # More adapters from NetworkChuck tools
        self.claude_code = ClaudeCodeAdapter()
        self.ai_in_the_terminal = AIInTheTerminalAdapter()
        self.mac_studio_cluster = MacStudioClusterAdapter()
        self.simplelogin = SimpleLoginAdapter()
        self.nodejs_goof = NodejsGoofAdapter()

        self.register_agent("claude_code", self.claude_code)
        self.register_agent("ai_in_the_terminal", self.ai_in_the_terminal)
        self.register_agent("mac_studio_cluster", self.mac_studio_cluster)
        self.register_agent("simplelogin", self.simplelogin)
        self.register_agent("nodejs_goof", self.nodejs_goof)

        # Additional automation adapters
        self.n8n = N8nAdapter()
        self.frigate_nvr = FrigateNVRAdapter()
        self.ansible = AnsibleAdapter()
        self.docker_mcp = DockerMCPAdapter()
        self.telos = TelosAdapter()

        self.register_agent("n8n", self.n8n)
        self.register_agent("frigate_nvr", self.frigate_nvr)
        self.register_agent("ansible", self.ansible)
        self.register_agent("docker_mcp", self.docker_mcp)
        self.register_agent("telos", self.telos)

        # Network tools adapters
        self.cisco_packet_tracer = CiscoPacketTracerAdapter()
        self.gns3 = GNS3Adapter()
        self.eve_ng = EVENgAdapter()
        self.wireshark = WiresharkAdapter()
        self.putty = PuttyAdapter()
        self.securecrt = SecureCRTAdapter()
        self.mobaxterm = MobaXtermAdapter()
        self.solarwinds = SolarWindsAdapter()
        self.zabbix = ZabbixAdapter()
        self.nessus = NessusAdapter()
        self.openvas = OpenVASAdapter()

        self.register_agent("cisco_packet_tracer", self.cisco_packet_tracer)
        self.register_agent("gns3", self.gns3)
        self.register_agent("eve_ng", self.eve_ng)
        self.register_agent("wireshark", self.wireshark)
        self.register_agent("putty", self.putty)
        self.register_agent("securecrt", self.securecrt)
        self.register_agent("mobaxterm", self.mobaxterm)
        self.register_agent("solarwinds", self.solarwinds)
        self.register_agent("zabbix", self.zabbix)
        self.register_agent("nessus", self.nessus)
        self.register_agent("openvas", self.openvas)
        # Enterprise/automation adapters
        self.adeptia_integration = AdeptiaConnectAdapter()
        self.boomi_atomsphere = BoomiAtomSphereAdapter()
        self.integrator_io = IntegratorIOAdapter()
        self.api2cart = API2CartAdapter()
        self.dell_boomi = DellBoomiAdapter()
        self.cleo_integration = CleoAdapter()
        self.cyclr_integration = CyclrAdapter()
        self.denodo_integration = DenodoAdapter()
        self.equalum_integration = EqualumAdapter()
        self.fivetran_integration = FivetranAdapter()
        self.pentaho_integration = PentahoAdapter()
        self.hvr_integration = HVRAdapter()
        self.ibm_infosphere_integration = IBMInfoSphereAdapter()
        self.informatica_integration = InformaticaAdapter()
        self.jitterbit_integration = JitterbitAdapter()
        self.keboola_integration = KeboolaAdapter()
        self.matillion_integration = MatillionAdapter()
        self.microsoft_ssis_integration = MicrosoftSSISAdapter()

        self.register_agent("adeptia_integration", self.adeptia_integration)
        self.register_agent("boomi_atomsphere", self.boomi_atomsphere)
        self.register_agent("integrator_io", self.integrator_io)
        self.register_agent("api2cart", self.api2cart)
        self.register_agent("dell_boomi", self.dell_boomi)
        self.register_agent("cleo_integration", self.cleo_integration)
        self.register_agent("cyclr_integration", self.cyclr_integration)
        self.register_agent("denodo_integration", self.denodo_integration)
        self.register_agent("equalum_integration", self.equalum_integration)
        self.register_agent("fivetran_integration", self.fivetran_integration)
        self.register_agent("pentaho_integration", self.pentaho_integration)
        self.register_agent("hvr_integration", self.hvr_integration)
        self.register_agent("ibm_infosphere_integration", self.ibm_infosphere_integration)
        self.register_agent("informatica_integration", self.informatica_integration)
        self.register_agent("jitterbit_integration", self.jitterbit_integration)
        self.register_agent("keboola_integration", self.keboola_integration)
        self.register_agent("matillion_integration", self.matillion_integration)
        self.register_agent("microsoft_ssis_integration", self.microsoft_ssis_integration)
        self._register_sample_workflow()

    def _register_sample_workflow(self):
        """Register a sample workflow chaining Fivetran → Denodo → Matillion → Cleo."""
        steps = [
            WorkflowStep("Extract from Fivetran", "fivetran_integration", "step"),
            WorkflowStep("Virtualize with Denodo", "denodo_integration", "step"),
            WorkflowStep("Transform with Matillion", "matillion_integration", "step"),
            WorkflowStep("Deliver via Cleo", "cleo_integration", "step"),
        ]
        self.workflow_engine.create_workflow("sample_etl_delivery", steps)

        # Instantiate and register all external agent adapters with strategic roles
        # self.openai_planner = OpenAIAgentAdapter()
        # TEMPORARY: DevinAIAgentAdapter is abstract and not implemented yet.
        # Commenting it out so the server can start. We'll fix it properly next.
        # self.devin_coder = DevinAIAgentAdapter()
        print("[RuntimeOrchestrator] DevinAIAgentAdapter skipped (will be re-enabled after implementation)")
        self.rasa_chat = RasaAgentAdapter()
        self.botpress_nlp = BotPressAgentAdapter()
        self.dify_tool = DifyAgentAdapter()
        self.autogpt_researcher = AutoGPTAgentAdapter()
        self.google_adk_connector = GoogleADKAgentAdapter()
        self.chatgpt_agent = ChatGPTAgentAdapter()
        
        # self.register_agent("openai_planner", self.openai_planner)
        # self.register_agent("devin_coder", self.devin_coder)
        self.register_agent("rasa_chat", self.rasa_chat)
        self.register_agent("botpress_nlp", self.botpress_nlp)
        self.register_agent("dify_tool", self.dify_tool)
        self.register_agent("autogpt_researcher", self.autogpt_researcher)
        self.register_agent("google_adk_connector", self.google_adk_connector)
        self.register_agent("chatgpt_agent", self.chatgpt_agent)

    def register_agent(self, name: str, agent: UniversalAgentInterface):
        self.registry.register(name, agent)
        agent.attach_event_bus(self.event_bus)

    def register_domain(self, name: str, domain):
        self.domains[name] = domain


    def start(self):
        self.running = True
        self.event_bus.publish(Event("runtime_started"))
        # Main runtime loop with governance, defensive, and economic hooks
        while self.running:
            for agent in self.registry.all():
                # Governance hook: can override or block agent actions
                if hasattr(self.governance, "pre_step") and self.governance.pre_step(agent) is False:
                    continue  # Blocked by governance
                # Defensive hook: can block dangerous actions
                if hasattr(self.defensive, "pre_step") and self.defensive.pre_step(agent) is False:
                    continue  # Blocked by defensive
                # Agent step
                agent.step()
                # Economic hook: reward/penalize after action
                if hasattr(self.economic, "post_step"):
                    self.economic.post_step(agent)
            break  # Remove or replace with real scheduling logic
        self.event_bus.publish(Event("runtime_stopped"))

    def stop(self):
        self.running = False
