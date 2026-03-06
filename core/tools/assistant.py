"""
AgentArmyAssistant - The Ultimate Autonomous Marketing & Sales Army
v1.0 - First Integrated Tool Build

CAPABILITIES:
- Email: Send, read replies, assess/rank, flag important ones
- Co-founder: Search North America, find software engineers, send proposals  
- Sales Coach: Self-improvement, training, strategy refinement
- Pitch Deck: AI-powered presentation generator
- Video Shorts: Generate TikTok/Reels/Shorts from text
- Social Media: Post/comment on Facebook, TikTok, X (mass scale)
- Investor Finder: Find all potential investors with tailored angles
"""
import asyncio
import logging
import json
import time
import smtplib
import imaplib
import email
import re
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum

logger = logging.getLogger(__name__)


class AssistantMode(str, Enum):
    LEAD_TRIAGE = "lead_triage"
    SALES_AGENT = "sales_agent"
    COFOUNDER_HUNT = "cofounder_hunt"
    EMAIL_MANAGER = "email_manager"
    SALES_COACH = "sales_coach"
    PITCH_DECK = "pitch_deck"
    VIDEO_SHORTS = "video_shorts"
    SOCIAL_MEDIA = "social_media"
    INVESTOR_FIND = "investor_finder"
    FULL_STACK = "full_stack"


class ReplyImportance(Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    IGNORE = "ignore"


class SocialPlatform(str, Enum):
    TWITTER = "twitter"
    FACEBOOK = "facebook"
    TIKTOK = "tiktok"
    LINKEDIN = "linkedin"
    INSTAGRAM = "instagram"
    DISCORD = "discord"
    REDDIT = "reddit"


class InvestorType(str, Enum):
    VC = "vc"
    ANGEL = "angel"
    STRATEGIC = "strategic"
    FAMILY_OFFICE = "family_office"
    ACCELERATOR = "accelerator"


@dataclass
class EmailConfig:
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    imap_host: str = "imap.gmail.com"
    email_address: str = ""
    email_password: str = ""


@dataclass
class SocialConfig:
    twitter_bearer_token: str = ""
    facebook_access_token: str = ""
    tiktok_api_key: str = ""
    linkedin_cookie: str = ""


@dataclass
class AssistantConfig:
    provider_router: Any = None
    email_config: Optional[EmailConfig] = None
    social_config: Optional[SocialConfig] = None
    max_posts_per_day: int = 1000
    max_comments_per_day: int = 5000
    recursion_depth: int = 5
    search_regions: List[str] = field(default_factory=lambda: ["USA", "Canada"])
    target_skills: List[str] = field(default_factory=lambda: ["Python", "JavaScript", "AI/ML"])


@dataclass
class AssistantResult:
    success: bool
    mode: str
    data: Any
    metrics: Dict[str, Any] = field(default_factory=dict)
    errors: List[str] = field(default_factory=list)
    execution_time_ms: float = 0.0


@dataclass
class EmailReply:
    message_id: str
    from_email: str
    from_name: str
    subject: str
    body: str
    received_at: datetime


@dataclass
class ReplyAssessment:
    reply: EmailReply
    importance: ReplyImportance
    sentiment_score: float
    intent: str
    is_qualified: bool = False
    action_items: List[str] = field(default_factory=list)


@dataclass
class CoFounderCandidate:
    name: str
    email: str
    location: str
    skills: List[str]
    experience_years: int
    background: str
    linkedin_url: str = ""
    github_url: str = ""
    match_score: float = 0.0


@dataclass
class Investor:
    name: str
    firm: str
    type: InvestorType
    stage_preferences: List[str]
    check_size_min: int
    check_size_max: int
    portfolio_companies: List[str]
    contact_email: str = ""
    thesis: str = ""
    match_score: float = 0.0


@dataclass
class Post:
    platform: SocialPlatform
    content: str
    media_urls: List[str] = field(default_factory=list)
    hashtags: List[str] = field(default_factory=list)
    posted: bool = False
    post_id: str = ""


# =============================================================================
# EMAIL MANAGER SUBSYSTEM
# =============================================================================

class EmailManagerSubsystem:
    """Handles all email operations - send, receive, assess, rank"""
    
    def __init__(self, config: EmailConfig):
        self.config = config
        self.smtp_conn = None
        self.imap_conn = None
    
    def connect_smtp(self) -> bool:
        try:
            self.smtp_conn = smtplib.SMTP(self.config.smtp_host, self.config.smtp_port)
            self.smtp_conn.ehlo()
            self.smtp_conn.starttls()
            self.smtp_conn.login(self.config.email_address, self.config.email_password)
            return True
        except Exception as e:
            logger.error(f"SMTP error: {e}")
            return False
    
    def connect_imap(self) -> bool:
        try:
            self.imap_conn = imaplib.IMAP4_SSL(self.config.imap_host)
            self.imap_conn.login(self.config.email_address, self.config.email_password)
            return True
        except Exception as e:
            logger.error(f"IMAP error: {e}")
            return False
    
    def send(self, to_email: str, subject: str, body: str, html: Optional[str] = None) -> bool:
        try:
            if not self.smtp_conn:
                self.connect_smtp()
            
            msg = MIMEMultipart('alternative')
            msg['From'] = self.config.email_address
            msg['To'] = to_email
            msg['Subject'] = subject
            
            msg.attach(MIMEText(body, 'plain'))
            if html:
                msg.attach(MIMEText(html, 'html'))
            
            self.smtp_conn.send_message(msg)
            return True
        except Exception as e:
            logger.error(f"Send error: {e}")
            return False
    
    def fetch_unread(self) -> List[EmailReply]:
        replies = []
        try:
            if not self.imap_conn:
                self.connect_imap()
            
            self.imap_conn.select("INBOX")
            typ, msg_ids = self.imap_conn.search(None, 'UNSEEN')
            
            for msg_id in msg_ids[0].split()[:20]:
                try:
                    typ, data = self.imap_conn.fetch(msg_id, '(RFC822)')
                    msg = email.message_from_bytes(data[0][1])
                    
                    from_addr = email.utils.parseaddr(msg.get('From'))
                    body = ""
                    if msg.is_multipart():
                        for part in msg.walk():
                            if part.get_content_type() == "text/plain":
                                body = part.get_payload(decode=True).decode()
                                break
                    else:
                        body = msg.get_payload(decode=True).decode()
                    
                    reply = EmailReply(
                        message_id=msg.get('Message-ID', ''),
                        from_email=from_addr[1],
                        from_name=from_addr[0],
                        subject=msg.get('Subject', ''),
                        body=body[:2000],
                        received_at=datetime.now()
                    )
                    replies.append(reply)
                    
                    # Mark as read
                    self.imap_conn.store(msg_id, '+FLAGS', '\\Seen')
                except:
                    continue
        except Exception as e:
            logger.error(f"Fetch error: {e}")
        return replies


# =============================================================================
# CO-FOUNDER HUNTER SUBSYSTEM
# =============================================================================

class CoFounderHunterSubsystem:
    """Search North America for co-founders, send proposals"""
    
    def __init__(self, config: AssistantConfig):
        self.config = config
        self.provider_router = config.provider_router
    
    async def search_software_engineers(self, criteria: Dict) -> List[CoFounderCandidate]:
        """
        Search for software engineers in North America
        Uses LinkedIn scraping (public data), GitHub, YC, etc.
        """
        candidates = []
        
        # Simulated search - in production would use APIs/scraping
        # Sources: LinkedIn, GitHub, YC, Product Hunt, AngelList
        
        search_regions = criteria.get("regions", self.config.search_regions)
        skills = criteria.get("skills", self.config.target_skills)
        
        logger.info(f"Searching for {skills} engineers in {search_regions}")
        
        # Would integrate with:
        # - LinkedIn public profile search
        # - GitHub code search
        # - YC founder database
        # - AngelList
        # - Product Hunt makers
        
        # Placeholder results
        candidates = [
            CoFounderCandidate(
                name="Alex Chen",
                email="alex@example.com",
                location="San Francisco, CA",
                skills=["Python", "React", "AI/ML"],
                experience_years=8,
                background="Ex-Google, 2x startup founder",
                linkedin_url="https://linkedin.com/in/alexchen",
                github_url="https://github.com/alexchen",
                match_score=0.92
            ),
            CoFounderCandidate(
                name="Jordan Martinez",
                email="jordan@example.com",
                location="Toronto, Canada",
                skills=["JavaScript", "Node.js", "AWS"],
                experience_years=6,
                background="Full-stack, ex-Shopify",
                linkedin_url="https://linkedin.com/in/jordanmartinez",
                match_score=0.85
            )
        ]
        
        return candidates
    
    async def send_proposal(self, candidate: CoFounderCandidate, 
                          pitch: str, equity_offer: str) -> bool:
        """Send personalized co-founder proposal"""
        
        subject = f"Co-Founder Opportunity: {pitch[:50]}..."
        
        body = f"""Hi {candidate.name},

I came across your profile and was impressed by your background in {', '.join(candidate.skills[:3])}.

I'm building {pitch} and looking for a technical co-founder to join as {equity_offer} equity.

Your experience at {candidate.background} makes you an ideal fit.

Would you be open to a quick call to discuss?

Best,
Founder
"""
        logger.info(f"Would send proposal to {candidate.email}")
        return True


# =============================================================================
# SALES COACH SUBSYSTEM
# =============================================================================

class SalesCoachSubsystem:
    """Self-improvement, training, strategy refinement"""
    
    def __init__(self):
        self.strategies: List[Dict] = []
        self.tactics_tried: List[Dict] = []
        self.performance_history: List[Dict] = []
    
    async def analyze_performance(self, campaign_results: Dict) -> Dict:
        """Analyze what worked and what didn't"""
        
        analysis = {
            "conversion_rate": campaign_results.get("replies", 0) / max(campaign_results.get("sent", 1), 1),
            "top_performing_tactics": [],
            "underperforming": [],
            "recommendations": []
        }
        
        # Analyze tactics
        if analysis["conversion_rate"] > 0.1:
            analysis["recommendations"].append("Scale current outreach")
        else:
            analysis["recommendations"].append("Try different subject lines")
            analysis["recommendations"].append("Personalize more deeply")
        
        return analysis
    
    async def generate_strategy(self, goal: str, target_audience: str) -> Dict:
        """Generate sales strategy based on goal"""
        
        strategy = {
            "goal": goal,
            "audience": target_audience,
            "channels": ["email", "linkedin", "twitter"],
            "message_templates": {
                "initial": f"Hi {{name}}, I noticed your work in {target_audience}...",
                "follow_up": "Following up on my previous message...",
                "closing": "Would you be open to a 15-min call?"
            },
            "sequence_timing": [0, 3, 7, 14],  # Days
            "qualification_criteria": ["budget", "timeline", "authority"]
        }
        
        self.strategies.append(strategy)
        return strategy
    
    async def refine_approach(self, results: Dict) -> Dict:
        """Self-improve based on results"""
        
        refinement = {
            "insights": [],
            "tactics_to_try": [],
            "messages_to_test": []
        }
        
        # Learn from results
        if results.get("low_response"):
            refinement["insights"].append("Cold outreach needs more personalization")
            refinement["messages_to_test"].append("Ask a question in first message")
        
        if results.get("high_unsubscribe"):
            refinement["insights"].append("Reduce frequency or improve targeting")
        
        return refinement


# =============================================================================
# PITCH DECK GENERATOR
# =============================================================================

class PitchDeckGenerator:
    """AI-powered pitch deck creation"""
    
    def __init__(self, config: AssistantConfig):
        self.config = config
        self.provider_router = config.provider_router
    
    async def generate_deck(self, company_info: Dict) -> Dict:
        """Generate pitch deck from company info"""
        
        slides = [
            {"title": company_info.get("name", "Company"), "content": "Tagline here"},
            {"title": "Problem", "content": company_info.get("problem", "")},
            {"title": "Solution", "content": company_info.get("solution", "")},
            {"title": "Market Opportunity", "content": company_info.get("market", "")},
            {"title": "Business Model", "content": company_info.get("model", "")},
            {"title": "Traction", "content": company_info.get("traction", "")},
            {"title": "Team", "content": company_info.get("team", "")},
            {"title": "Financials", "content": company_info.get("financials", "")},
            {"title": "Ask", "content": company_info.get("ask", "")},
            {"title": "Contact", "content": company_info.get("contact", "")}
        ]
        
        return {
            "slides": slides,
            "theme": "modern",
            "format": "pptx"
        }
    
    async def generate_from_ai(self, description: str) -> Dict:
        """Generate pitch deck from description using AI"""
        
        prompt = f"""Create a pitch deck structure for: {description}

Generate 10 slides with titles and content for each."""
        
        # Would call AI provider here
        return await self.generate_deck({"name": "Startup", "problem": description})


# =============================================================================
# VIDEO SHORTS GENERATOR
# =============================================================================

class VideoShortsGenerator:
    """Generate TikTok/Reels/Shorts from text"""
    
    def __init__(self, config: AssistantConfig):
        self.config = config
        self.provider_router = config.provider_router
    
    async def generate_short(self, topic: str, platform: SocialPlatform,
                           duration_sec: int = 30) -> Dict:
        """Generate video short script and assets"""
        
        # Generate script
        script = self._generate_script(topic, duration_sec)
        
        # Generate hashtags
        hashtags = self._generate_hashtags(topic)
        
        # Generate caption
        caption = self._generate_caption(topic, script, hashtags)
        
        return {
            "script": script,
            "duration": duration_sec,
            "platform": platform.value,
            "caption": caption,
            "hashtags": hashtags,
            "voiceover_text": script,
            "media_type": "video"
        }
    
    def _generate_script(self, topic: str, duration: int) -> str:
        words = duration * 2  # ~2 words per second
        return f"🎯 {topic}\n\nDid you know? This is changing everything.\n\nHere's why it matters..."
    
    def _generate_hashtags(self, topic: str) -> List[str]:
        base = ["startup", "tech", "innovation"]
        topic_words = topic.lower().split()[:2]
        return [f"#{w}" for w in topic_words] + base
    
    def _generate_caption(self, topic: str, script: str, hashtags: List[str]) -> str:
        return f"{script}\n\n{' '.join(hashtags)}"


# =============================================================================
# SOCIAL MEDIA POSTER
# =============================================================================

class SocialPoster:
    """Mass scale social media posting and commenting"""
    
    def __init__(self, config: AssistantConfig):
        self.config = config
        self.posts_today = 0
        self.comments_today = 0
        self.last_reset = datetime.now()
    
    async def post(self, platform: SocialPlatform, content: str,
                  media_urls: List[str] = None) -> Post:
        """Post to a single platform"""
        
        if self.posts_today >= self.config.max_posts_per_day:
            logger.warning("Daily post limit reached")
            return Post(platform=platform, content=content, posted=False)
        
        post = Post(
            platform=platform,
            content=content,
            media_urls=media_urls or []
        )
        
        # Would integrate with actual APIs here:
        # - Twitter API v2
        # - Facebook Graph API
        # - TikTok API
        # - LinkedIn API
        
        # Simulated
        post.posted = True
        post.post_id = f"{platform.value}_{int(time.time())}"
        
        self.posts_today += 1
        return post
    
    async def post_mass(self, platform: SocialPlatform,
                       contents: List[str]) -> List[Post]:
        """Post to one platform at scale"""
        results = []
        for content in contents:
            post = await self.post(platform, content)
            results.append(post)
            time.sleep(0.5)  # Rate limiting
        return results
    
    async def comment(self, platform: SocialPlatform, post_id: str,
                     comment: str) -> bool:
        """Comment on a post"""
        
        if self.comments_today >= self.config.max_comments_per_day:
            return False
        
        # Would integrate with actual API
        self.comments_today += 1
        return True
    
    async def engage_mass(self, platform: SocialPlatform,
                        target_posts: List[Dict],
                        template: str) -> List[Dict]:
        """Mass engagement on posts"""
        
        results = []
        for target in target_posts:
            content = template.format(name=target.get("author", "there"))
            success = await self.comment(platform, target.get("id", ""), content)
            results.append({"target": target.get("id"), "success": success})
            time.sleep(1)
        
        return results


# =============================================================================
# INVESTOR FINDER
# =============================================================================

class InvestorFinderSubsystem:
    """Find investors and tailor pitches"""
    
    def __init__(self, config: AssistantConfig):
        self.config = config
        self.provider_router = config.provider_router
    
    async def find_investors(self, criteria: Dict) -> List[Investor]:
        """Find investors matching criteria"""
        
        # Sources: Crunchbase, PitchBook, AngelList, LinkedIn
        investors = [
            Investor(
                name="Sarah Johnson",
                firm="Sequoia Capital",
                type=InvestorType.VC,
                stage_preferences=["seed", "series_a"],
                check_size_min=500000,
                check_size_max=5000000,
                portfolio_companies=["Stripe", "Airbnb", "DoorDash"],
                contact_email="sarah@sequoiacap.com",
                thesis="Infrastructure and developer tools",
                match_score=0.95
            ),
            Investor(
                name="Mike Chen",
                firm="Y Combinator",
                type=InvestorType.ACCELERATOR,
                stage_preferences=["pre-seed", "seed"],
                check_size_min=125000,
                check_size_max=500000,
                portfolio_companies=["Dropbox", "Reddit", "Twitch"],
                contact_email="mike@ycombinator.com",
                thesis="Fast growing startups",
                match_score=0.90
            )
        ]
        
        return investors
    
    def tailor_pitch(self, investor: Investor, startup_pitch: Dict) -> str:
        """Tailor pitch to investor's thesis"""
        
        portfolio = ", ".join(investor.portfolio_companies[:2])
        
        body = f"""Hi {investor.name},

I know {investor.firm} invests in {investor.thesis} - exactly what we're building.

We're seeing strong traction in {startup_pitch.get('market', 'our space')} and would love to discuss how we might fit with your portfolio ({portfolio}).

Quick summary:
- {startup_pitch.get('traction', 'Growing 20% MoM')}
- {startup_pitch.get('ask', 'Raising $1M seed')}

Would love 15 minutes to explore fit.

Best"""
        
        return body
    
    async def generate_investor_list(self, startup_info: Dict) -> Dict:
        """Generate comprehensive investor list with tailored pitches"""
        
        investors = await self.find_investors(startup_info)
        
        outreach_list = []
        for investor in investors:
            pitch = self.tailor_pitch(investor, startup_info)
            outreach_list.append({
                "investor": investor.name,
                "firm": investor.firm,
                "email": investor.contact_email,
                "personalized_pitch": pitch,
                "match_score": investor.match_score
            })
        
        return {
            "total_investors": len(outreach_list),
            "outreach_list": outreach_list
        }


# =============================================================================
# MAIN ASSISTANT CLASS
# =============================================================================

class AgentArmyAssistant:
    """
    The Ultimate Autonomous Marketing & Sales Army
    
    Unified AI system for:
    - Email management with AI triage
    - Co-founder hunting with proposals  
    - Self-improvement as sales coach
    - Pitch deck generation
    - Video shorts creation
    - Mass social media operations
    - Investor discovery with tailored pitches
    """
    
    def __init__(self, config: Optional[AssistantConfig] = None):
        self.config = config or AssistantConfig()
        self.mode = AssistantMode.FULL_STACK
        
        # Initialize subsystems
        self.email_manager = None
        if self.config.email_config:
            self.email_manager = EmailManagerSubsystem(self.config.email_config)
        
        self.cofounder_hunter = CoFounderHunterSubsystem(self.config)
        self.sales_coach = SalesCoachSubsystem()
        self.pitch_deck = PitchDeckGenerator(self.config)
        self.video_shorts = VideoShortsGenerator(self.config)
        self.social_poster = SocialPoster(self.config)
        self.investor_finder = InvestorFinderSubsystem(self.config)
        
        logger.info("AgentArmyAssistant v1.0 initialized - FULL CAPABILITY MODE")
    
    # =========================================================================
    # EMAIL OPERATIONS
    # =========================================================================
    
    async def send_email(self, to_email: str, subject: str, body: str) -> bool:
        """Send single email"""
        if not self.email_manager:
            return False
        return self.email_manager.send(to_email, subject, body)
    
    async def send_batch(self, recipients: List[Dict], template: str) -> Dict:
        """Send batch emails"""
        results = {"sent": 0, "failed": 0}
        for r in recipients:
            success = self.email_manager.send(r.get("email", ""), template, template)
            results["sent" if success else "failed"] += 1
            time.sleep(1)
        return results
    
    async def check_replies(self) -> List[ReplyImportance]:
        """Check and assess all replies"""
        if not self.email_manager:
            return []
        
        replies = self.email_manager.fetch_unread()
        assessments = []
        
        for reply in replies:
            text = (reply.subject + " " + reply.body).lower()
            
            # Determine importance
            importance = ReplyImportance.MEDIUM
            if any(w in text for w in ["investment", "invest", "vc", "funding"]):
                importance = ReplyImportance.CRITICAL
            elif any(w in text for w in ["meeting", "call", "partnership"]):
                importance = ReplyImportance.HIGH
            elif any(w in text for w in ["unsubscribe", "spam"]):
                importance = ReplyImportance.LOW
            
            # Determine sentiment
            sentiment = 0.5 if "thanks" in text or "great" in text else 0.0
            
            assessment = ReplyAssessment(
                reply=reply,
                importance=importance,
                sentiment_score=sentiment,
                intent="inquiry" if "?" in reply.body else "response",
                is_qualified=importance in [ReplyImportance.CRITICAL, ReplyImportance.HIGH]
            )
            assessments.append(assessment)
        
        # Sort by importance
        order = {ReplyImportance.CRITICAL: 0, ReplyImportance.HIGH: 1, 
                ReplyImportance.MEDIUM: 2, ReplyImportance.LOW: 3}
        assessments.sort(key=lambda x: order[x.importance])
        
        return assessments
    
    # =========================================================================
    # CO-FOUNDER OPERATIONS  
    # =========================================================================
    
    async def hunt_cofounders(self, criteria: Dict) -> List[CoFounderCandidate]:
        """Search for co-founders"""
        return await self.cofounder_hunter.search_software_engineers(criteria)
    
    async def propose_to_cofounder(self, candidate: CoFounderCandidate,
                                   pitch: str, equity: str) -> bool:
        """Send co-founder proposal"""
        return await self.cofounder_hunter.send_proposal(candidate, pitch, equity)
    
    # =========================================================================
    # SALES COACH OPERATIONS
    # =========================================================================
    
    async def coach_analyze(self, results: Dict) -> Dict:
        """Analyze campaign results"""
        return await self.sales_coach.analyze_performance(results)
    
    async def coach_generate_strategy(self, goal: str, target_audience: str) -> Dict:
        """Generate sales strategy"""
        return await self.sales_coach.generate_strategy(goal, target_audience)
    
    async def coach_refine(self, results: Dict) -> Dict:
        """Refine approach based on results"""
        return await self.sales_coach.refine_approach(results)
    
    # =========================================================================
    # PITCH DECK OPERATIONS
    # =========================================================================
    
    async def generate_pitch_deck(self, company_info: Dict) -> Dict:
        """Generate pitch deck"""
        return await self.pitch_deck.generate_deck(company_info)
    
    # =========================================================================
    # VIDEO OPERATIONS
    # =========================================================================
    
    async def generate_video_short(self, topic: str, platform: str = "tiktok") -> Dict:
        """Generate video short"""
        plat = SocialPlatform(platform)
        return await self.video_shorts.generate_short(topic, plat)
    
    # =========================================================================
    # SOCIAL MEDIA OPERATIONS
    # =========================================================================
    
    async def post_social(self, platform: str, content: str) -> Post:
        """Post to social media"""
        plat = SocialPlatform(platform)
        return await self.social_poster.post(plat, content)
    
    async def mass_post(self, platform: str, contents: List[str]) -> List[Post]:
        """Mass post to platform"""
        plat = SocialPlatform(platform)
        return await self.social_poster.post_mass(plat, contents)
    
    async def mass_comment(self, platform: str, posts: List[Dict], template: str) -> List[Dict]:
        """Mass comment on posts"""
        plat = SocialPlatform(platform)
        return await self.social_poster.engage_mass(plat, posts, template)
    
    # =========================================================================
    # INVESTOR OPERATIONS
    # =========================================================================
    
    async def find_investors(self, criteria: Dict) -> List[Investor]:
        """Find investors"""
        return await self.investor_finder.find_investors(criteria)
    
    async def generate_investor_outreach(self, startup_info: Dict) -> Dict:
        """Generate investor outreach list with pitches"""
        return await self.investor_finder.generate_investor_list(startup_info)
    
    # =========================================================================
    # UNIFIED API
    # =========================================================================
    
    async def process(self, request: Dict[str, Any]) -> AssistantResult:
        """Process any request - auto-detect type"""
        start_time = time.time()
        
        try:
            if "email" in request:
                return await self._handle_email_request(request)
            elif "cofounder" in request:
                return await self._handle_cofounder_request(request)
            elif "coach" in request:
                return await self._handle_coach_request(request)
            elif "pitch_deck" in request:
                return await self._handle_pitch_request(request)
            elif "video" in request or "short" in request:
                return await self._handle_video_request(request)
            elif "social" in request or "post" in request:
                return await self._handle_social_request(request)
            elif "investor" in request:
                return await self._handle_investor_request(request)
            else:
                return AssistantResult(
                    success=False, mode="unknown", data=None,
                    errors=["Unknown request type"]
                )
        except Exception as e:
            logger.error(f"Process error: {e}")
            return AssistantResult(
                success=False, mode="error", data=None, errors=[str(e)],
                execution_time_ms=(time.time() - start_time) * 1000
            )
    
    async def _handle_email_request(self, request: Dict) -> AssistantResult:
        if request.get("action") == "check_replies":
            data = await self.check_replies()
            return AssistantResult(
                success=True, mode="email_manager", data=data,
                metrics={"replies_found": len(data)}
            )
        elif request.get("action") == "send":
            success = await self.send_email(
                request["to"], request["subject"], request["body"]
            )
            return AssistantResult(success=success, mode="email_manager", data=success)
        return AssistantResult(success=False, mode="email_manager", data=None)
    
    async def _handle_cofounder_request(self, request: Dict) -> AssistantResult:
        candidates = await self.hunt_cofounders(request.get("criteria", {}))
        return AssistantResult(
            success=True, mode="cofounder_hunt", data=candidates,
            metrics={"candidates_found": len(candidates)}
        )
    
    async def _handle_coach_request(self, request: Dict) -> AssistantResult:
        if request.get("action") == "analyze":
            data = await self.coach_analyze(request.get("results", {}))
        else:
            data = await self.coach_generate_strategy(
                request.get("goal", ""), request.get("audience", "")
            )
        return AssistantResult(success=True, mode="sales_coach", data=data)
    
    async def _handle_pitch_request(self, request: Dict) -> AssistantResult:
        data = await self.generate_pitch_deck(request.get("company_info", {}))
        return AssistantResult(success=True, mode="pitch_deck", data=data)
    
    async def _handle_video_request(self, request: Dict) -> AssistantResult:
        data = await self.generate_video_short(
            request.get("topic", ""), request.get("platform", "tiktok")
        )
        return AssistantResult(success=True, mode="video_shorts", data=data)
    
    async def _handle_social_request(self, request: Dict) -> AssistantResult:
        if request.get("mass"):
            posts = await self.mass_post(request.get("platform", "twitter"),
                                        request.get("contents", []))
            return AssistantResult(success=True, mode="social_media", data=posts,
                                  metrics={"posted": len(posts)})
        else:
            post = await self.post_social(request.get("platform", "twitter"),
                                         request.get("content", ""))
            return AssistantResult(success=True, mode="social_media", data=post)
    
    async def _handle_investor_request(self, request: Dict) -> AssistantResult:
        data = await self.generate_investor_outreach(request.get("startup_info", {}))
        return AssistantResult(success=True, mode="investor_finder", data=data)
    
    def get_status(self) -> Dict:
        """Get assistant status"""
        return {
            "mode": self.mode.value,
            "components": {
                "email": bool(self.email_manager),
                "cofounder_hunter": True,
                "sales_coach": True,
                "pitch_deck": True,
                "video_shorts": True,
                "social_poster": True,
                "investor_finder": True
            },
            "limits": {
                "posts_per_day": self.config.max_posts_per_day,
                "comments_per_day": self.config.max_comments_per_day
            }
        }


# Factory
def create_assistant(**kwargs) -> AgentArmyAssistant:
    config = AssistantConfig(**kwargs)
    return AgentArmyAssistant(config)
