export type MobileVendor = "apple" | "samsung" | "google" | "amazon";

export type MobilePlugin = {
  id: string;
  name: string;
  vendor: MobileVendor;
  description: string;
  downloadUrl: string;
  ecosystem: string;
};

export const mobilePlugins: MobilePlugin[] = [
  {
    id: "agentarmy-ios-bridge",
    name: "AgentArmy iOS Bridge",
    vendor: "apple",
    description: "Mobile control surface for iPhone/iPad with secure orchestration actions.",
    downloadUrl: "https://apps.apple.com/",
    ecosystem: "Apple App Store",
  },
  {
    id: "agentarmy-galaxy-bridge",
    name: "AgentArmy Galaxy Bridge",
    vendor: "samsung",
    description: "Galaxy integration plugin for notifications, approvals, and quick actions.",
    downloadUrl: "https://galaxystore.samsung.com/",
    ecosystem: "Samsung Galaxy Store",
  },
  {
    id: "agentarmy-android-bridge",
    name: "AgentArmy Android Bridge",
    vendor: "google",
    description: "Android plugin for mobile workflow dispatch and Copilot-style summaries.",
    downloadUrl: "https://play.google.com/store",
    ecosystem: "Google Play Store",
  },
  {
    id: "agentarmy-fire-bridge",
    name: "AgentArmy Fire Bridge",
    vendor: "amazon",
    description: "Amazon device integration for approvals and workflow alerts.",
    downloadUrl: "https://www.amazon.com/mobile-apps",
    ecosystem: "Amazon Appstore",
  },
];
