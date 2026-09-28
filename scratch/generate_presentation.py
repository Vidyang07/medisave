import os
import sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

# ==============================================================================
# MEDISAVE Presentation Generator for Community Engagement Program (CEP)
# PICT - Division: SY 2 | Batch: H2
# ==============================================================================

# Palette
BG_COLOR = RGBColor(248, 248, 245)      # Warm Ivory #F8F8F5
CARD_BG = RGBColor(255, 255, 255)       # Pure White #FFFFFF
TEAL_PRIMARY = RGBColor(15, 76, 66)     # Deep Forest Teal #0F4C42
TEAL_LIGHT = RGBColor(232, 243, 241)    # Soft Sage Teal #E8F3F1
TEXT_PRIMARY = RGBColor(23, 23, 23)     # Dark Charcoal #171717
TEXT_MUTED = RGBColor(90, 90, 90)       # Neutral Gray #5A5A5A
BORDER_COLOR = RGBColor(228, 226, 221)  # Subtle Card Border #E4E2DD
EMERALD = RGBColor(21, 128, 61)         # Green #15803D
EMERALD_BG = RGBColor(236, 253, 245)    # Light Green #ECFDF5
AMBER = RGBColor(180, 83, 9)            # Amber #B45309
AMBER_BG = RGBColor(254, 243, 199)      # Light Amber #FEF3C7
ROSE = RGBColor(190, 18, 60)            # Rose #BE123C
ROSE_BG = RGBColor(255, 241, 242)       # Light Rose #FFF1F2
PURPLE = RGBColor(107, 33, 168)         # Purple #6B21A8
PURPLE_BG = RGBColor(250, 245, 255)     # Light Purple #FAF5FF

def create_presentation():
    prs = Presentation()
    # 16:9 Widescreen dimensions
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    def set_slide_background(slide):
        bg_shape = slide.shapes.add_shape(
            MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height
        )
        bg_shape.fill.solid()
        bg_shape.fill.fore_color.rgb = BG_COLOR
        bg_shape.line.fill.background()
        return bg_shape

    def add_header(slide, title, category, speaker_info=""):
        # Header container
        header_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.733), Inches(0.9))
        tf = header_box.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0

        # Category / Section pill
        p0 = tf.paragraphs[0]
        p0.text = f"{category.upper()}  •  {speaker_info}" if speaker_info else category.upper()
        p0.font.name = "Segoe UI"
        p0.font.size = Pt(9.5)
        p0.font.bold = True
        p0.font.color.rgb = TEAL_PRIMARY
        p0.space_after = Pt(2)

        # Title
        p1 = tf.add_paragraph()
        p1.text = title
        p1.font.name = "Segoe UI"
        p1.font.size = Pt(22)
        p1.font.bold = True
        p1.font.color.rgb = TEXT_PRIMARY

    def add_card(slide, left, top, width, height, title="", subtitle="", bg_color=CARD_BG, border_color=BORDER_COLOR):
        card = slide.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height
        )
        card.fill.solid()
        card.fill.fore_color.rgb = bg_color
        if border_color:
            card.line.color.rgb = border_color
            card.line.width = Pt(1)
        else:
            card.line.fill.background()

        if title or subtitle:
            tb = slide.shapes.add_textbox(left + Inches(0.2), top + Inches(0.18), width - Inches(0.4), height - Inches(0.36))
            tf = tb.text_frame
            tf.word_wrap = True
            tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0

            if title:
                p0 = tf.paragraphs[0]
                p0.text = title
                p0.font.name = "Segoe UI"
                p0.font.size = Pt(13)
                p0.font.bold = True
                p0.font.color.rgb = TEXT_PRIMARY
                p0.space_after = Pt(4)

            if subtitle:
                p1 = tf.add_paragraph()
                p1.text = subtitle
                p1.font.name = "Segoe UI"
                p1.font.size = Pt(10)
                p1.font.color.rgb = TEXT_MUTED
        return card

    def add_bullet_list(slide, left, top, width, height, items, font_size=10.5, spacing=6):
        tb = slide.shapes.add_textbox(left, top, width, height)
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0

        for i, item in enumerate(items):
            p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
            p.text = f"•  {item}"
            p.font.name = "Segoe UI"
            p.font.size = Pt(font_size)
            p.font.color.rgb = TEXT_PRIMARY
            p.space_after = Pt(spacing)

    def add_footer(slide, current_slide, total_slides=22):
        footer_box = slide.shapes.add_textbox(Inches(0.8), Inches(7.0), Inches(11.733), Inches(0.35))
        tf = footer_box.text_frame
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        p = tf.paragraphs[0]
        p.text = f"MEDISAVE  •  Community Engagement Program (CEP)  •  PICT Pune  |  Slide {current_slide} of {total_slides}"
        p.font.name = "Segoe UI"
        p.font.size = Pt(9)
        p.font.color.rgb = TEXT_MUTED

    def add_speaker_notes(slide, speaker, duration, key_points):
        notes_slide = slide.notes_slide
        tf = notes_slide.notes_text_frame
        notes_text = f"SPEAKER: {speaker} | ALLOCATED TIME: {duration}\n"
        notes_text += "KEY TALKING POINTS:\n"
        for pt in key_points:
            notes_text += f"- {pt}\n"
        tf.text = notes_text

    # ==========================================================================
    # SLIDE 1: TITLE SLIDE
    # ==========================================================================
    s1 = prs.slides.add_slide(blank_layout)
    set_slide_background(s1)

    # Main Hero Container
    add_card(s1, Inches(0.8), Inches(0.8), Inches(11.733), Inches(5.8), bg_color=CARD_BG, border_color=BORDER_COLOR)

    # Title Top Badge
    badge = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.2), Inches(1.2), Inches(3.8), Inches(0.4))
    badge.fill.solid()
    badge.fill.fore_color.rgb = TEAL_LIGHT
    badge.line.color.rgb = TEAL_PRIMARY
    badge.line.width = Pt(1)
    tf = badge.text_frame
    tf.margin_top = Inches(0.06)
    p = tf.paragraphs[0]
    p.text = "COMMUNITY ENGAGEMENT PROGRAM (CEP)"
    p.font.name = "Segoe UI"
    p.font.size = Pt(9.5)
    p.font.bold = True
    p.font.color.rgb = TEAL_PRIMARY
    p.alignment = PP_ALIGN.CENTER

    # Hero Title & Subtitle
    tb = s1.shapes.add_textbox(Inches(1.2), Inches(1.75), Inches(10.9), Inches(1.8))
    tf = tb.text_frame
    tf.word_wrap = True
    p0 = tf.paragraphs[0]
    p0.text = "MEDISAVE"
    p0.font.name = "Segoe UI"
    p0.font.size = Pt(40)
    p0.font.bold = True
    p0.font.color.rgb = TEAL_PRIMARY

    p1 = tf.add_paragraph()
    p1.text = "Verified Community Medicine Exchange & Redistribution Platform"
    p1.font.name = "Segoe UI"
    p1.font.size = Pt(17)
    p1.font.bold = True
    p1.font.color.rgb = TEXT_PRIMARY
    p1.space_before = Pt(4)

    p2 = tf.add_paragraph()
    p2.text = "A full-stack web application designed for proximity-aware medicine discovery, deterministic fair pricing, and coordinator-supervised Schedule H prescription compliance."
    p2.font.name = "Segoe UI"
    p2.font.size = Pt(11)
    p2.font.color.rgb = TEXT_MUTED
    p2.space_before = Pt(6)

    # 4 Team Members Grid
    team_members = [
        ("Ronit Subhedar", "Roll No. 21270", "Problem Context & Workflow"),
        ("Vidyang Wagh", "Roll No. 21282", "Locality, Handover & AI Pricing"),
        ("Darshan Solanke", "Roll No. 21269", "Prescription & Security"),
        ("Sumukh Bhat", "Roll No. 21271", "Testing, Scalability & Demo"),
    ]

    for idx, (name, roll, role) in enumerate(team_members):
        col_left = Inches(1.2 + idx * 2.75)
        add_card(s1, col_left, Inches(3.8), Inches(2.6), Inches(1.8), bg_color=TEAL_LIGHT, border_color=TEAL_PRIMARY)
        tb_m = s1.shapes.add_textbox(col_left + Inches(0.15), Inches(3.95), Inches(2.3), Inches(1.5))
        tf_m = tb_m.text_frame
        tf_m.word_wrap = True
        
        p = tf_m.paragraphs[0]
        p.text = name
        p.font.name = "Segoe UI"
        p.font.size = Pt(12)
        p.font.bold = True
        p.font.color.rgb = TEAL_PRIMARY
        
        p = tf_m.add_paragraph()
        p.text = roll
        p.font.name = "Segoe UI"
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = TEXT_PRIMARY
        p.space_before = Pt(2)

        p = tf_m.add_paragraph()
        p.text = f"Focus: {role}"
        p.font.name = "Segoe UI"
        p.font.size = Pt(9)
        p.font.color.rgb = TEXT_MUTED
        p.space_before = Pt(4)

    # Bottom Metadata
    tb_meta = s1.shapes.add_textbox(Inches(1.2), Inches(5.8), Inches(10.9), Inches(0.6))
    tf_meta = tb_meta.text_frame
    p_meta = tf_meta.paragraphs[0]
    p_meta.text = "Department of Computer Engineering  •  Pune Institute of Computer Technology (PICT)  |  Division: SY 2  •  Batch: H2  |  GitHub: github.com/Vidyang07/medisave"
    p_meta.font.name = "Segoe UI"
    p_meta.font.size = Pt(9.5)
    p_meta.font.color.rgb = TEXT_MUTED

    add_footer(s1, 1)
    add_speaker_notes(s1, "Ronit Subhedar", "1.5 mins", [
        "Introduce the MEDISAVE project under the Community Engagement Program (CEP).",
        "Introduce team members from Division SY 2, Batch H2 at PICT Pune.",
        "Highlight that this project addresses unused household medicines through a structured, verified full-stack platform.",
        "Emphasize that this is an academic prototype with working software, automated tests, and GitHub repository reference."
    ])

    # ==========================================================================
    # SLIDE 2: THE COMMUNITY PROBLEM
    # ==========================================================================
    s2 = prs.slides.add_slide(blank_layout)
    set_slide_background(s2)
    add_header(s2, "The Real-World Community Medicine Dilemma", "Problem Context", "Speaker: Ronit Subhedar")

    # Left: Concrete Real-World Scenario
    add_card(s2, Inches(0.8), Inches(1.5), Inches(5.7), Inches(5.2), "The Common Household Scenario", "Everyday medicine wastage in urban communities", bg_color=CARD_BG)
    scenario_points = [
        "A student or family completes a doctor-prescribed treatment course with 10–15 unexpired, sealed blister tablets remaining.",
        "These unexpired medicines sit in home medicine cabinets until they pass their expiration date and are eventually thrown into trash.",
        "Simultaneously, a neighboring student or low-income community member is prescribed the exact same formulation and pays full retail price.",
        "Traditional e-commerce platforms cannot legally or safely facilitate peer-to-peer exchanges without strict compliance mechanisms.",
        "Direct physical exchanges without verification pose severe safety, shelf-life, and prescription misuse risks."
    ]
    add_bullet_list(s2, Inches(1.0), Inches(2.2), Inches(5.3), Inches(4.3), scenario_points, font_size=10.5, spacing=8)

    # Right: 3 Core Challenges
    challenges = [
        ("Fragmented Discovery & Verification", "Community members have no trusted directory to identify who holds unexpired surplus medications nearby.", AMBER_BG, AMBER),
        ("Safety, Shelf Life & Quality Concerns", "Physical blister seals, batch authenticity, and minimum expiration buffers must be audited before handover.", ROSE_BG, ROSE),
        ("Geographic Friction & Pricing Confusion", "Distant transfers across large metro areas (e.g. Katraj to Hinjewadi) are unfeasible without locality awareness.", TEAL_LIGHT, TEAL_PRIMARY),
    ]

    for idx, (ch_title, ch_desc, c_bg, c_border) in enumerate(challenges):
        top_pos = Inches(1.5 + idx * 1.75)
        add_card(s2, Inches(6.8), top_pos, Inches(5.7), Inches(1.6), ch_title, ch_desc, bg_color=c_bg, border_color=c_border)

    add_footer(s2, 2)
    add_speaker_notes(s2, "Ronit Subhedar", "1.5 mins", [
        "Explain the everyday problem without fabricating macro statistics.",
        "Contrast household medicine surplus with healthcare affordability for students/families.",
        "Highlight the 3 technical barriers: Discovery, Safety verification, and Distance/Pricing friction."
    ])

    # ==========================================================================
    # SLIDE 3: COMMUNITY ENGAGEMENT OBJECTIVE
    # ==========================================================================
    s3 = prs.slides.add_slide(blank_layout)
    set_slide_background(s3)
    add_header(s3, "Our Community Engagement Objectives", "Project Objectives", "Speaker: Ronit Subhedar")

    objectives = [
        ("Reduce Medicine Wastage", "Provide a responsible, structured mechanism to redistribute unopened, unexpired surplus medicines before they reach expiration.", EMERALD_BG, EMERALD),
        ("Ensure Transparent Non-Profit Pricing", "Eliminate price gouging by deriving suggested community prices strictly from printed MRP, shelf life, and condition.", TEAL_LIGHT, TEAL_PRIMARY),
        ("Enforce Prescription Verification", "Mandate coordinator review for Schedule H/H1 drugs so prescription regulations are respected.", PURPLE_BG, PURPLE),
        ("Enable Proximity-Aware Local Handover", "Match buyers and donors within practical walking/metro handover zones rather than promising unrealistic courier delivery.", AMBER_BG, AMBER),
    ]

    for idx, (obj_title, obj_desc, o_bg, o_border) in enumerate(objectives):
        col = idx % 2
        row = idx // 2
        left_p = Inches(0.8 + col * 5.95)
        top_p = Inches(1.5 + row * 2.65)
        add_card(s3, left_p, top_p, Inches(5.75), Inches(2.45), f"Objective {idx+1}: {obj_title}", obj_desc, bg_color=o_bg, border_color=o_border)
        
        # Details list
        sub_items = []
        if idx == 0:
            sub_items = ["Min. 90-day expiry buffer mandatory", "Intact factory sealed blister foils only", "No cut strips or unsealed syrups allowed"]
        elif idx == 1:
            sub_items = ["Deterministic shelf-life bracket formula", "Authoritative printed MRP ground truth", "Server-enforced 85% maximum price cap"]
        elif idx == 2:
            sub_items = ["Secure PDF/JPG/PNG document upload", "Private authenticated document streaming", "Doctor registration check before checkout"]
        else:
            sub_items = ["Haversine distance calculation (0–5 km nearby)", "Designated public landmarks (Campus Gates)", "Clear non-logistics community disclaimer"]
        
        add_bullet_list(s3, left_p + Inches(0.2), top_p + Inches(1.0), Inches(5.35), Inches(1.3), sub_items, font_size=10, spacing=4)

    add_footer(s3, 3)
    add_speaker_notes(s3, "Ronit Subhedar", "1.5 mins", [
        "Walk through the 4 core pillars of our Community Engagement Program.",
        "Emphasize that we balance affordability with safety (mandatory 90-day buffer, prescription checks).",
        "Clarify that community handover is an intentional design choice for local feasibility."
    ])

    # ==========================================================================
    # SLIDE 4: PROPOSED SOLUTION - ECOSYSTEM
    # ==========================================================================
    s4 = prs.slides.add_slide(blank_layout)
    set_slide_background(s4)
    add_header(s4, "The MEDISAVE Ecosystem Architecture", "Proposed Solution", "Speaker: Ronit Subhedar")

    # Workflow step boxes
    steps = [
        ("1. Donor Listing", "Seller inputs medicine name, batch, printed MRP & locality.", TEAL_LIGHT),
        ("2. AI Assistance", "OpenRouter assists with salt, form & baseline estimate.", PURPLE_BG),
        ("3. Policy Engine", "Deterministic formula calculates community price & 85% cap.", EMERALD_BG),
        ("4. Coordinator Review", "Admin inspects packaging, expiry & approves listing.", AMBER_BG),
        ("5. Proximity Match", "Marketplace sorts listings by Haversine distance for buyer.", TEAL_LIGHT),
        ("6. Prescription Audit", "Buyer uploads Rx; coordinator verifies before checkout.", PURPLE_BG),
        ("7. Order & Handover", "Mutual agreement on campus/public handover point.", EMERALD_BG),
    ]

    for idx, (st_title, st_desc, s_bg) in enumerate(steps):
        left_pos = Inches(0.8 + idx * 1.7)
        add_card(s4, left_pos, Inches(1.5), Inches(1.55), Inches(5.2), st_title, st_desc, bg_color=s_bg, border_color=BORDER_COLOR)

    add_footer(s4, 4)
    add_speaker_notes(s4, "Ronit Subhedar", "1.5 mins", [
        "Explain the end-to-end 7-step lifecycle of medicine on MEDISAVE.",
        "Highlight that every listing passes through validation, policy constraints, and coordinator moderation before becoming live.",
        "Demonstrate how donor, coordinator, and recipient interact seamlessly."
    ])

    # ==========================================================================
    # SLIDE 5: USER JOURNEYS
    # ==========================================================================
    s5 = prs.slides.add_slide(blank_layout)
    set_slide_background(s5)
    add_header(s5, "Dual Stakeholder User Journeys", "User Experience", "Speaker: Ronit Subhedar")

    # Left: Donor / Seller Journey
    add_card(s5, Inches(0.8), Inches(1.5), Inches(5.7), Inches(5.2), "Donor / Seller Journey", "Listing surplus unexpired medicines responsibly", bg_color=CARD_BG, border_color=TEAL_PRIMARY)
    seller_journey = [
        "Account Setup: Registers verified profile with Pune locality (e.g. Katraj) and contact number.",
        "Medicine Entry: Inputs medicine brand; AI autofills salt, manufacturer, and dosage form.",
        "Printed MRP Ground Truth: Inputs physical box MRP, packaging condition, and batch number.",
        "Policy Confirmation: Reviews suggested community price & rationale; applies 1-click pricing.",
        "Handover Point Setup: Selects preferred public point (e.g. College Gate) and radius (5 km).",
        "Fulfillment: Receives order notification and confirms physical handover with recipient."
    ]
    add_bullet_list(s5, Inches(1.0), Inches(2.2), Inches(5.3), Inches(4.3), seller_journey, font_size=10, spacing=8)

    # Right: Recipient / Buyer Journey
    add_card(s5, Inches(6.8), Inches(1.5), Inches(5.7), Inches(5.2), "Recipient / Buyer Journey", "Discovering & acquiring verified affordable medicines", bg_color=CARD_BG, border_color=EMERALD)
    buyer_journey = [
        "Locality Discovery: Selects current Pune locality (e.g. Hinjewadi or Kothrud).",
        "Nearby First Sorting: Browses verified listings sorted by proximity with distance badges.",
        "Inspection & Details: Reviews packaging condition, remaining shelf life, and pricing rationale.",
        "Prescription Upload: For Schedule H items, attaches approved prescription or uploads new one.",
        "Multi-Seller Cart: Combines items from multiple donors into a single consolidated checkout.",
        "Handover Selection: Chooses 'Agreed Public Point' and coordinates in-person exchange."
    ]
    add_bullet_list(s5, Inches(7.0), Inches(2.2), Inches(5.3), Inches(4.3), buyer_journey, font_size=10, spacing=8)

    add_footer(s5, 5)
    add_speaker_notes(s5, "Ronit Subhedar", "1.5 mins", [
        "Walk through the parallel journeys of both primary users.",
        "Highlight that donors receive immediate pricing guidance and buyers get proximity transparency.",
        "Conclude Section 1 and hand over to Vidyang Wagh for Locality, Handover & Smart Pricing."
    ])

    # ==========================================================================
    # SLIDE 6: LOCALITY & PROXIMITY (KATRAJ VS HINJEWADI)
    # ==========================================================================
    s6 = prs.slides.add_slide(blank_layout)
    set_slide_background(s6)
    add_header(s6, "Addressing the Long-Distance Problem: Katraj vs Hinjewadi", "Locality & Handover", "Speaker: Vidyang Wagh")

    # Critical Judge Question Callout Box
    add_card(s6, Inches(0.8), Inches(1.45), Inches(11.733), Inches(1.1), "Core Judge Question Answered:", "If a donor is in Katraj and a recipient is in Hinjewadi, how does MEDISAVE deliver the medicine?", bg_color=AMBER_BG, border_color=AMBER)

    # Comparison Cards
    add_card(s6, Inches(0.8), Inches(2.75), Inches(5.7), Inches(4.0), "The Long-Distance Reality (Katraj ↔ Hinjewadi)", "Cross-city transfers are unfeasible for informal peer exchange", bg_color=ROSE_BG, border_color=ROSE)
    distant_pts = [
        "Physical Distance: ~20.4 km across Pune metropolitan traffic.",
        "Platform Classification: 'Far from you · 20.4 km' proximity badge.",
        "Marketplace Behavior: Deprioritized in search results when buyer is in Hinjewadi.",
        "Intentional Design Choice: MEDISAVE does NOT operate a city-wide courier fleet.",
        "Avoids Inefficient Exchanges: Alerts users to long travel distances before ordering."
    ]
    add_bullet_list(s6, Inches(1.0), Inches(3.45), Inches(5.3), Inches(3.1), distant_pts, font_size=10, spacing=6)

    add_card(s6, Inches(6.8), Inches(2.75), Inches(5.7), Inches(4.0), "The Local Community Model (Katraj ↔ Bibvewadi)", "Proximity-aware discovery enables practical local handover", bg_color=EMERALD_BG, border_color=EMERALD)
    nearby_pts = [
        "Physical Distance: ~2.1 km (walking/short transit distance).",
        "Platform Classification: 'Nearby · 2.1 km' high-priority badge.",
        "Marketplace Behavior: Ranked at top under 'Nearby First' sorting.",
        "Convenient Handover: Exchange at Bharati Vidyapeeth Campus Gate or Vanaz Metro.",
        "Mathematical Model: Deterministic Spherical Haversine distance on pre-mapped Pune coordinates."
    ]
    add_bullet_list(s6, Inches(7.0), Inches(3.45), Inches(5.3), Inches(3.1), nearby_pts, font_size=10, spacing=6)

    add_footer(s6, 6)
    add_speaker_notes(s6, "Vidyang Wagh", "1.5 mins", [
        "Directly tackle Judge Question 1 with confidence and honesty.",
        "Explain that MEDISAVE is a community matching exchange, not a delivery logistics company.",
        "Show how the deterministic Haversine distance engine classifies Katraj vs Hinjewadi (20.4km distant) vs Katraj vs Bibvewadi (2.1km nearby)."
    ])

    # ==========================================================================
    # SLIDE 7: COMMUNITY HANDOVER MODEL
    # ==========================================================================
    s7 = prs.slides.add_slide(blank_layout)
    set_slide_background(s7)
    add_header(s7, "Community Handover & Fulfillment Model", "Fulfillment Architecture", "Speaker: Vidyang Wagh")

    add_card(s7, Inches(0.8), Inches(1.5), Inches(5.7), Inches(5.2), "Implemented Community Handover (MVP)", "Practical peer coordination without third-party logistics", bg_color=TEAL_LIGHT, border_color=TEAL_PRIMARY)
    mvp_handover = [
        "Designated Public Points: Handover at verified campus gates, metro stations, or community centers.",
        "Proximity Radius: Donors set comfortable handover radius (e.g. 5 km).",
        "Dual Checkout Selection: Buyer explicitly selects 'Agreed Public Point' or 'Nearby Direct Handover'.",
        "Visual Packaging Audit: Recipient inspects physical blister foil integrity at the moment of exchange.",
        "Transparent Platform Disclaimer: UI clearly states: 'MEDISAVE facilitates community matching; we do not operate a courier fleet.'"
    ]
    add_bullet_list(s7, Inches(1.0), Inches(2.2), Inches(5.3), Inches(4.3), mvp_handover, font_size=10.5, spacing=8)

    add_card(s7, Inches(6.8), Inches(1.5), Inches(5.7), Inches(5.2), "Future Community Logistics Scope", "Planned fulfillment expansions for institutional scaling", bg_color=CARD_BG, border_color=BORDER_COLOR)
    future_logistics = [
        "Campus Collection Hubs: Establishing drop-off points at PICT Health Center or Student Council Desk.",
        "Student Health Volunteers: Senior pharmacy/engineering volunteers assisting with peer package audits.",
        "Mutual Handover OTP: 4-digit mobile verification code exchanged during physical handover.",
        "Third-Party Hyperlocal Delivery: Optional integration with local on-demand delivery APIs as platform scales.",
        "Cold-Chain Tracking: Strict exclusion of biologics/insulins until certified cold-chain couriers exist."
    ]
    add_bullet_list(s7, Inches(7.0), Inches(2.2), Inches(5.3), Inches(4.3), future_logistics, font_size=10.5, spacing=8)

    add_footer(s7, 7)
    add_speaker_notes(s7, "Vidyang Wagh", "1.5 mins", [
        "Clarify the distinction between what is implemented today vs proposed future scope.",
        "Emphasize the explicit UI notice: MEDISAVE does not operate a delivery fleet.",
        "Explain campus collection hubs as a practical pilot mechanism for college environments."
    ])

    # ==========================================================================
    # SLIDE 8: THE PRICING PROBLEM
    # ==========================================================================
    s8 = prs.slides.add_slide(blank_layout)
    set_slide_background(s8)
    add_header(s8, "The Medicine Pricing Dilemma in Community Exchanges", "Pricing Architecture", "Speaker: Vidyang Wagh")

    # 3 Dilemma Cards
    dilemmas = [
        ("Why Arbitrary Pricing Fails", "If sellers set prices freely, commercial resellers might list expired or overpriced items, destroying community trust.", ROSE_BG, ROSE, [
            "Risk of commercial profiteering on donated medicines",
            "Inconsistent prices for identical formulations",
            "Lack of transparency on packaging & shelf life"
        ]),
        ("Why AI Cannot Decide Final Price", "LLMs can hallucinate pharmaceutical pricing or suggest volatile market rates that violate community policies.", AMBER_BG, AMBER, [
            "AI outputs are estimates, not legal pharmaceutical rates",
            "LLMs lack physical ground truth of box MRP",
            "Regulatory compliance demands deterministic rules"
        ]),
        ("The MEDISAVE Deterministic Policy", "Combine authoritative printed MRP + remaining shelf life + packaging condition into a transparent mathematical formula.", EMERALD_BG, EMERALD, [
            "Authoritative printed MRP entered by donor",
            "Transparent discount brackets based on expiry date",
            "Hard server-side 85% price cap prevents abuse"
        ]),
    ]

    for idx, (d_title, d_sub, d_bg, d_border, d_items) in enumerate(dilemmas):
        left_pos = Inches(0.8 + idx * 3.95)
        add_card(s8, left_pos, Inches(1.5), Inches(3.8), Inches(5.2), d_title, d_sub, bg_color=d_bg, border_color=d_border)
        add_bullet_list(s8, left_pos + Inches(0.15), Inches(2.7), Inches(3.5), Inches(3.8), d_items, font_size=10, spacing=6)

    add_footer(s8, 8)
    add_speaker_notes(s8, "Vidyang Wagh", "1.5 mins", [
        "Introduce the second major question: 'How is the medicine price decided?'",
        "Explain why neither free-market seller pricing nor pure AI generation is acceptable for medicine exchange.",
        "Introduce the MEDISAVE deterministic formula grounded in physical printed MRP."
    ])

    # ==========================================================================
    # SLIDE 9: DETERMINISTIC PRICING ENGINE
    # ==========================================================================
    s9 = prs.slides.add_slide(blank_layout)
    set_slide_background(s9)
    add_header(s9, "Deterministic Community Pricing Policy & Guardrails", "Pricing Engine", "Speaker: Vidyang Wagh")

    # Top Formula Banner
    add_card(s9, Inches(0.8), Inches(1.45), Inches(11.733), Inches(1.15), "MEDISAVE Transparent Pricing Formula:", "Suggested Price = round( Printed MRP  ×  Expiry Multiplier  ×  Condition Factor )", bg_color=TEAL_LIGHT, border_color=TEAL_PRIMARY)

    # 4 Bracket Cards
    brackets = [
        ("> 12 Months Expiry", "Multiplier: 0.60\nCommunity Savings: 40% Off", "Long shelf life ensures extended safe usage buffer for recipient.", EMERALD_BG, EMERALD),
        ("6 – 12 Months Expiry", "Multiplier: 0.50\nCommunity Savings: 50% Off", "Standard shelf life for acute or regular course medications.", TEAL_LIGHT, TEAL_PRIMARY),
        ("3 – 6 Months Expiry", "Multiplier: 0.35\nCommunity Savings: 65% Off", "Near-term window requires steep discount for rapid redistribution.", AMBER_BG, AMBER),
        ("< 90 Days Expiry", "Multiplier: Ineligible\nStatus: REJECTED", "Safety Policy: Medicines expiring within 90 days are strictly barred.", ROSE_BG, ROSE),
    ]

    for idx, (b_title, b_rate, b_desc, b_bg, b_border) in enumerate(brackets):
        left_pos = Inches(0.8 + idx * 2.95)
        add_card(s9, left_pos, Inches(2.75), Inches(2.85), Inches(3.0), b_title, b_rate, bg_color=b_bg, border_color=b_border)
        tb_d = s9.shapes.add_textbox(left_pos + Inches(0.15), Inches(4.3), Inches(2.55), Inches(1.3))
        tf_d = tb_d.text_frame
        tf_d.word_wrap = True
        p_d = tf_d.paragraphs[0]
        p_d.text = b_desc
        p_d.font.name = "Segoe UI"
        p_d.font.size = Pt(9.5)
        p_d.font.color.rgb = TEXT_MUTED

    # Bottom Guardrail Note
    add_card(s9, Inches(0.8), Inches(5.9), Inches(11.733), Inches(0.9), "Server-Side Anti-Profiteering Cap (85% Maximum MRP Guardrail)", "The backend strictly rejects any listing where Offered Price > 0.85 × Printed MRP. Client price tampering is rejected with HTTP 400.", bg_color=CARD_BG, border_color=BORDER_COLOR)

    add_footer(s9, 9)
    add_speaker_notes(s9, "Vidyang Wagh", "1.5 mins", [
        "Highlight the mathematical brackets implemented in pricingService.js.",
        "Explain that <90 day medicines are rejected automatically for patient safety.",
        "Mention the server-side 85% price cap that prevents profiteering on donated goods."
    ])

    # ==========================================================================
    # SLIDE 10: AI MEDICINE INTELLIGENCE
    # ==========================================================================
    s10 = prs.slides.add_slide(blank_layout)
    set_slide_background(s10)
    add_header(s10, "OpenRouter AI Integration: Identification Assistant", "AI Architecture", "Speaker: Vidyang Wagh")

    # Left: What AI Assists With
    add_card(s10, Inches(0.8), Inches(1.5), Inches(5.7), Inches(5.2), "AI Capabilities (Assistant Role)", "Normalizing complex pharmaceutical data during listing", bg_color=CARD_BG, border_color=PURPLE)
    ai_caps = [
        "Brand Name Normalization: Resolves typos & alternate spellings (e.g. 'dolomide' → 'Dolomide').",
        "Generic Salt Formulation: Identifies active compounds (Paracetamol 500mg + Domperidone 10mg).",
        "Manufacturer Extraction: Identifies pharmaceutical firm (Micro Labs Ltd., GSK, Cipla).",
        "Dosage Form & Packaging: Classifies Tablets, Capsules, Syrups, and standard pack strip quantities.",
        "Schedule H Classification: Identifies whether the medication mandates a registered prescription.",
        "Storage Guidance: Generates proper storage advisories (<25°C, protect from moisture)."
    ]
    add_bullet_list(s10, Inches(1.0), Inches(2.2), Inches(5.3), Inches(4.3), ai_caps, font_size=10, spacing=7)

    # Right: Concrete Example Card
    add_card(s10, Inches(6.8), Inches(1.5), Inches(5.7), Inches(5.2), "Live AI Example: 'Dolo 650'", "Structured metadata returned by AI endpoint", bg_color=PURPLE_BG, border_color=PURPLE)
    example_pts = [
        "Medicine Brand: Dolo 650 Tablets",
        "Generic Salt: Paracetamol IP (650 mg)",
        "Manufacturer: Micro Labs Ltd.",
        "Therapeutic Category: Pain & Fever",
        "Standard Packaging: 15 Tablets (1 strip)",
        "Prescription Classification: Over-The-Counter (OTC)",
        "Estimated Retail MRP: ~₹35 (Used as reference estimate)",
        "Suggested Community Price: ₹18 (Derived via deterministic policy)",
        "Storage Guidance: Store below 25°C away from direct sunlight"
    ]
    add_bullet_list(s10, Inches(7.0), Inches(2.2), Inches(5.3), Inches(4.3), example_pts, font_size=10, spacing=5)

    add_footer(s10, 10)
    add_speaker_notes(s10, "Vidyang Wagh", "1.5 mins", [
        "Explain OpenRouter integration in aiMedicineService.js.",
        "Walk through the Dolo 650 example.",
        "Reiterate clearly: AI assists with metadata normalization, but physical printed MRP entered by seller is authoritative."
    ])

    # ==========================================================================
    # SLIDE 11: AI ARCHITECTURE & OFFLINE FALLBACK
    # ==========================================================================
    s11 = prs.slides.add_slide(blank_layout)
    set_slide_background(s11)
    add_header(s11, "AI Robustness & Zero-Downtime Offline Fallback", "AI Architecture", "Speaker: Vidyang Wagh")

    # Critical Judge Question Callout Box
    add_card(s11, Inches(0.8), Inches(1.45), Inches(11.733), Inches(1.0), "Judge Question Answered: What happens if AI gives wrong info or OpenRouter is offline?", "AI outputs are suggestions requiring seller/admin confirmation; offline knowledge base activates on API failure.", bg_color=TEAL_LIGHT, border_color=TEAL_PRIMARY)

    # Left: Multi-Layer Architecture
    add_card(s11, Inches(0.8), Inches(2.6), Inches(5.7), Inches(4.2), "Multi-Tier AI Validation Flow", "Strict schema validation and safety checks", bg_color=CARD_BG, border_color=BORDER_COLOR)
    flow_steps = [
        "1. Seller inputs medicine title on listing page.",
        "2. Express invokes aiMedicineService.js with structured schema prompt.",
        "3. OpenRouter LLM returns JSON (Gemini 2.0 Flash / Claude / LLaMA).",
        "4. Server validates JSON against allowed category and dosage enums.",
        "5. Seller verifies fields against physical packaging before submission.",
        "6. Coordinator reviews listing in admin queue before public marketplace release."
    ]
    add_bullet_list(s11, Inches(1.0), Inches(3.2), Inches(5.3), Inches(3.4), flow_steps, font_size=10, spacing=6)

    # Right: Offline Knowledge Base
    add_card(s11, Inches(6.8), Inches(2.6), Inches(5.7), Inches(4.2), "Offline Knowledge Base & Heuristic Engine", "Zero-downtime resilience when OpenRouter is unavailable", bg_color=EMERALD_BG, border_color=EMERALD)
    kb_pts = [
        "Curated Pharmaceutical Registry: Instant exact matching for core drugs (Dolo 650, Dolomide, Augmentin 625 Duo, Pantocid 40, Pan-D, Shelcal 500, Azee 500).",
        "Algorithmic Heuristics: Regex-based strength extractor (500mg, 650mg) and category classifier for unknown medicines.",
        "Zero API Dependency: Application functions completely offline or during OpenRouter rate limits.",
        "Verified Test Coverage: 12/12 automated AI fallback test cases passed."
    ]
    add_bullet_list(s11, Inches(7.0), Inches(3.2), Inches(5.3), Inches(3.4), kb_pts, font_size=10, spacing=6)

    add_footer(s11, 11)
    add_speaker_notes(s11, "Vidyang Wagh", "1.5 mins", [
        "Answer Judge Question 3: AI is an assistant, not an authority.",
        "Explain the offline fallback knowledge base containing Dolo 650, Augmentin, Pantocid 40, Pan-D, etc.",
        "Conclude Section 2 and hand over to Darshan Solanke for Prescription & Security."
    ])

    # ==========================================================================
    # SLIDE 12: PRESCRIPTION VERIFICATION
    # ==========================================================================
    s12 = prs.slides.add_slide(blank_layout)
    set_slide_background(s12)
    add_header(s12, "Schedule H / H1 Prescription Verification Workflow", "Medical Compliance", "Speaker: Darshan Solanke")

    # Workflow Steps
    rx_steps = [
        ("1. Prescription Required", "Medications with Schedule H classification cannot be checked out without an approved Rx document.", ROSE_BG, ROSE),
        ("2. Multi-Format Upload", "Buyer uploads prescription document (PDF, JPG, PNG up to 5 MB) with patient metadata.", PURPLE_BG, PURPLE),
        ("3. Coordinator Audit", "Coordinator reviews doctor registration number, patient name & validity date in admin dashboard.", AMBER_BG, AMBER),
        ("4. Approval & Checkout", "Approved prescription unlocks checkout eligibility. Rejected documents record mandatory reason.", EMERALD_BG, EMERALD),
    ]

    for idx, (rx_t, rx_d, rx_bg, rx_border) in enumerate(rx_steps):
        left_pos = Inches(0.8 + idx * 2.95)
        add_card(s12, left_pos, Inches(1.5), Inches(2.85), Inches(5.2), rx_t, rx_d, bg_color=rx_bg, border_color=rx_border)
        
        # Sub-points for each step
        sub_pts = []
        if idx == 0:
            sub_pts = ["Antibiotics (Augmentin, Azee)", "Cardiovascular drugs (Telma)", "Anti-diabetic formulations"]
        elif idx == 1:
            sub_pts = ["Multer file validation", "Safe server-generated IDs", "5 MB strict payload limit"]
        elif idx == 2:
            sub_pts = ["Private document stream", "Doctor registry check", "Optional future validUntil date"]
        else:
            sub_pts = ["Single Rx covers multiple items", "Stock decrements atomically", "Expired Rx rejected at checkout"]
            
        add_bullet_list(s12, left_pos + Inches(0.15), Inches(3.2), Inches(2.55), Inches(3.2), sub_pts, font_size=9.5, spacing=6)

    add_footer(s12, 12)
    add_speaker_notes(s12, "Darshan Solanke", "1.5 mins", [
        "Answer Judge Question 4 regarding prescription compliance.",
        "Explain the 4-step workflow: Requirement detection, Upload, Coordinator audit, and Checkout unlocking.",
        "Mention multi-format upload (PDF/JPG/PNG <= 5MB) and private streaming."
    ])

    # ==========================================================================
    # SLIDE 13: SECURITY & PRIVACY ARCHITECTURE
    # ==========================================================================
    s13 = prs.slides.add_slide(blank_layout)
    set_slide_background(s13)
    add_header(s13, "Security & Patient Privacy Architecture", "Security Engineering", "Speaker: Darshan Solanke")

    sec_cards = [
        ("Authentication & Access Control", "JWT + bcrypt + Role-Based Access Control", CARD_BG, TEAL_PRIMARY, [
            "Stateless JWT token authentication with 7-day expiration",
            "Bcrypt salted password hashing (work factor 10)",
            "Role-Based Access Control: 'user' vs 'admin'",
            "Protected admin routes rejected with HTTP 403 for non-admins"
        ]),
        ("Document Privacy & IDOR Defense", "Private prescription streaming & ownership isolation", CARD_BG, PURPLE, [
            "Prescriptions strictly bound to authenticated buyer JWT ID",
            "Insecure Direct Object Reference (IDOR) prevention (403)",
            "Documents stored outside public static web roots",
            "Path traversal defense on authenticated file streaming"
        ]),
        ("Input Validation & Tamper Immunity", "Server-side ground truth calculation", CARD_BG, EMERALD, [
            "Client price spoofing overridden by database ground truth",
            "Seller ID strictly bound to authenticated donor",
            "Atomic stock decrement prevents overselling & race conditions",
            "Zero tracked secrets (verified .gitignore & .env.example)"
        ]),
    ]

    for idx, (s_title, s_sub, s_bg, s_border, s_items) in enumerate(sec_cards):
        left_pos = Inches(0.8 + idx * 3.95)
        add_card(s13, left_pos, Inches(1.5), Inches(3.8), Inches(5.2), s_title, s_sub, bg_color=s_bg, border_color=s_border)
        add_bullet_list(s13, left_pos + Inches(0.15), Inches(2.7), Inches(3.5), Inches(3.8), s_items, font_size=10, spacing=7)

    add_footer(s13, 13)
    add_speaker_notes(s13, "Darshan Solanke", "1.5 mins", [
        "Walk through the 3 security pillars verified in our automated test suite.",
        "Explain IDOR protection: User A cannot read or stream User B's medical documents.",
        "Emphasize that all pricing, prescription checks, and stock decrements are validated server-side."
    ])

    # ==========================================================================
    # SLIDE 14: ADMIN MODERATION SYSTEM
    # ==========================================================================
    s14 = prs.slides.add_slide(blank_layout)
    set_slide_background(s14)
    add_header(s14, "Coordinator Moderation & Oversight Dashboard", "Platform Governance", "Speaker: Darshan Solanke")

    # Critical Judge Question Callout Box
    add_card(s14, Inches(0.8), Inches(1.45), Inches(11.733), Inches(1.0), "Judge Question Answered: How do you prevent fake, expired, or unsafe medicine listings?", "Dual-queue moderation workflow: All listings and prescriptions start as 'pending' until coordinator approval.", bg_color=TEAL_LIGHT, border_color=TEAL_PRIMARY)

    # Left: Medicine Queue
    add_card(s14, Inches(0.8), Inches(2.6), Inches(5.7), Inches(4.2), "Medicine Listing Moderation Queue", "Pre-approval audit before public marketplace indexing", bg_color=CARD_BG, border_color=BORDER_COLOR)
    med_mod_pts = [
        "Pending Status Default: Newly submitted listings remain invisible to public marketplace.",
        "Physical Inspection Check: Coordinator audits batch number, expiry date (>= 90 days), and packaging.",
        "Approval & Rejection Actions: 1-click approval publishes listing; rejection requires documented reason.",
        "Rejection Reason Persistence: Donor sees why a listing was declined (e.g. damaged foil, illegible batch).",
        "Listing Deletion & Ban: Permanent deletion for hazardous or illegal submissions."
    ]
    add_bullet_list(s14, Inches(1.0), Inches(3.2), Inches(5.3), Inches(3.4), med_mod_pts, font_size=10, spacing=6)

    # Right: Prescription Queue
    add_card(s14, Inches(6.8), Inches(2.6), Inches(5.7), Inches(4.2), "Prescription Verification Queue", "Medical compliance audit for Schedule H requests", bg_color=PURPLE_BG, border_color=PURPLE)
    rx_mod_pts = [
        "Document Review: Coordinator streams uploaded PDF/JPG within authenticated viewer.",
        "Doctor Registration Check: Cross-checks doctor registration number against registry.",
        "Validity Date Tagging: Admin can assign custom validUntil expiration dates.",
        "Rejection Transparency: Documents with expired doctor dates or mismatched patient names are flagged.",
        "Order Oversight: Complete audit trail of multi-seller transactions across Pune."
    ]
    add_bullet_list(s14, Inches(7.0), Inches(3.2), Inches(5.3), Inches(3.4), rx_mod_pts, font_size=10, spacing=6)

    add_footer(s14, 14)
    add_speaker_notes(s14, "Darshan Solanke", "1.5 mins", [
        "Answer Judge Question 5 on fake/unsafe listing prevention.",
        "Explain that listings default to 'pending' and are hidden from buyers until coordinator audit.",
        "Mention the admin prescription queue and transaction oversight tools."
    ])

    # ==========================================================================
    # SLIDE 15: TECHNOLOGY ARCHITECTURE
    # ==========================================================================
    s15 = prs.slides.add_slide(blank_layout)
    set_slide_background(s15)
    add_header(s15, "Full-Stack Technology Architecture (MERN)", "Technical Architecture", "Speaker: Darshan Solanke")

    # 4 Stack Column Cards
    stack = [
        ("Frontend Layer", "React 19 + Vite", TEAL_LIGHT, TEAL_PRIMARY, [
            "React 19 single page application",
            "Vite 8.2 ultra-fast bundler",
            "Tailwind CSS custom design tokens",
            "React Router v7 client navigation",
            "Axios API client with interceptors",
            "Responsive desktop/mobile layouts"
        ]),
        ("Backend REST API", "Node.js + Express 5", PURPLE_BG, PURPLE, [
            "Express 5 RESTful routing",
            "JWT & Bcrypt security middleware",
            "Multer multipart document parser",
            "Deterministic pricing engine",
            "Haversine proximity distance engine",
            "Automated regression test suites"
        ]),
        ("Database Layer", "MongoDB + Mongoose 8", EMERALD_BG, EMERALD, [
            "Mongoose 8 object modeling",
            "Status & locality indexing",
            "Atomic stock decrement transactions",
            "Dual-collection order architecture",
            "Locality coordinates schema",
            "Backfilled 111 seed medicines"
        ]),
        ("AI & Intelligence", "OpenRouter API", AMBER_BG, AMBER, [
            "Gemini 2.0 Flash / Claude / LLaMA",
            "Structured pharmaceutical JSON prompt",
            "Offline knowledge base fallback",
            "Heuristic dosage/salt regex parser",
            "Zero downtime on rate limits",
            "Deterministic policy integration"
        ]),
    ]

    for idx, (st_t, st_sub, st_bg, st_border, st_items) in enumerate(stack):
        left_pos = Inches(0.8 + idx * 2.95)
        add_card(s15, left_pos, Inches(1.5), Inches(2.85), Inches(5.2), st_t, st_sub, bg_color=st_bg, border_color=st_border)
        add_bullet_list(s15, left_pos + Inches(0.15), Inches(2.7), Inches(2.55), Inches(3.8), st_items, font_size=9.5, spacing=6)

    add_footer(s15, 15)
    add_speaker_notes(s15, "Darshan Solanke", "1.5 mins", [
        "Explain the clean MERN stack architecture.",
        "Highlight that all code is modularized into routes, controllers, services, models, and middleware.",
        "Conclude Section 3 and hand over to Sumukh Bhat for Testing, Scalability & Demo."
    ])

    # ==========================================================================
    # SLIDE 16: AUTOMATED TESTING & VERIFICATION
    # ==========================================================================
    s16 = prs.slides.add_slide(blank_layout)
    set_slide_background(s16)
    add_header(s16, "Automated Verification & Test Suite Results", "Quality Assurance", "Speaker: Sumukh Bhat")

    # 4 Test Summary Metric Cards
    metrics = [
        ("369 / 369", "Automated Assertions", "100% Pass Rate across 12 backend test suites", EMERALD_BG, EMERALD),
        ("0 / 0", "Linting Errors / Warnings", "ESLint clean across React frontend code", TEAL_LIGHT, TEAL_PRIMARY),
        ("516 ms", "Production Build Time", "Vite production client compilation verified", PURPLE_BG, PURPLE),
        ("101 Files", "Clean GitHub Release", "Zero committed secrets or .env leaks", AMBER_BG, AMBER),
    ]

    for idx, (m_val, m_title, m_desc, m_bg, m_border) in enumerate(metrics):
        left_pos = Inches(0.8 + idx * 2.95)
        add_card(s16, left_pos, Inches(1.5), Inches(2.85), Inches(1.7), "", "", bg_color=m_bg, border_color=m_border)
        tb_m = s16.shapes.add_textbox(left_pos + Inches(0.15), Inches(1.65), Inches(2.55), Inches(1.4))
        tf_m = tb_m.text_frame
        tf_m.word_wrap = True
        
        p = tf_m.paragraphs[0]
        p.text = m_val
        p.font.name = "Segoe UI"
        p.font.size = Pt(20)
        p.font.bold = True
        p.font.color.rgb = m_border
        
        p = tf_m.add_paragraph()
        p.text = m_title
        p.font.name = "Segoe UI"
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = TEXT_PRIMARY
        p.space_before = Pt(2)

        p = tf_m.add_paragraph()
        p.text = m_desc
        p.font.name = "Segoe UI"
        p.font.size = Pt(8.5)
        p.font.color.rgb = TEXT_MUTED

    # Detailed Test Suites Table
    add_card(s16, Inches(0.8), Inches(3.4), Inches(11.733), Inches(3.3), "Verified Test Suites Breakdown", "Executed against live local MongoDB & Express environment", bg_color=CARD_BG, border_color=BORDER_COLOR)
    
    test_col1 = [
        "Locality & Distance Engine: Haversine distance, proximity tiers, Katraj vs Hinjewadi (20.4km) -> PASS (100%)",
        "Deterministic Pricing Policy: 40%/50%/65% brackets, <90-day rejection, 85% MRP cap -> PASS (100%)",
        "Pharma Knowledge Base & AI Fallback: 12 pharmaceutical test cases with zero-downtime -> PASS (12/12)",
        "Admin Moderation Workflow: Role permissions, queue isolation, approval/rejection -> PASS (27/27)",
        "Seller Order Lifecycle: Status state transitions, multi-seller item isolation -> PASS (37/37)",
        "Cart & Order API: Self-purchase blocked, DB price enforcement, inventory buyout -> PASS (23/23)"
    ]
    add_bullet_list(s16, Inches(1.0), Inches(4.05), Inches(5.5), Inches(2.5), test_col1, font_size=9, spacing=4)

    test_col2 = [
        "Multi-Seller Cart E2E: Multi-donor orders, consolidated checkout, inventory recovery -> PASS (13/13)",
        "Prescription Model & Validation: Mongoose constraints, required patient fields -> PASS (13/13)",
        "Prescription Upload Layer: PDF/JPG/PNG multi-format upload, 5MB limit, safe filenames -> PASS (19/19)",
        "Buyer Document Access: IDOR prevention, streaming headers, path traversal defense -> PASS (30/30)",
        "Admin Prescription Review: Approval with validUntil, rejection reasons, doc stream -> PASS (48/48)",
        "Prescription Checkout Security: Schedule H enforcement, price spoofing immunity -> PASS (112/112)"
    ]
    add_bullet_list(s16, Inches(6.8), Inches(4.05), Inches(5.5), Inches(2.5), test_col2, font_size=9, spacing=4)

    add_footer(s16, 16)
    add_speaker_notes(s16, "Sumukh Bhat", "1.5 mins", [
        "Present the exact verified testing numbers without inflation.",
        "Highlight that 369 automated assertions across 12 test suites passed with 100% success.",
        "Mention frontend ESLint clean and fast 516ms production build."
    ])

    # ==========================================================================
    # SLIDE 17: REAL-WORLD LIMITATIONS
    # ==========================================================================
    s17 = prs.slides.add_slide(blank_layout)
    set_slide_background(s17)
    add_header(s17, "Real-World Limitations & Prototype Boundaries", "Honest Evaluation", "Speaker: Sumukh Bhat")

    limits = [
        ("No Proprietary Delivery Fleet", "MEDISAVE does not operate a delivery fleet. Transactions rely on mutual public point handover, campus collection hubs, or local transit.", ROSE_BG, ROSE),
        ("AI Assistance vs Human Verification", "AI outputs are non-authoritative recommendations. Sellers and coordinators must physically inspect medicine foil packaging and expiry markings.", AMBER_BG, AMBER),
        ("Prescription Coordinator Overhead", "Schedule H verification currently requires manual coordinator review, which could become a bottleneck at high transaction volumes.", PURPLE_BG, PURPLE),
        ("Exclusion of Cold-Chain Medicines", "Biologics, vaccines, and insulins requiring strict 2–8°C refrigerated transport are intentionally barred from platform listing.", TEAL_LIGHT, TEAL_PRIMARY),
        ("Academic Prototype Status", "This is an academic CEP engineering prototype. Commercial deployment would require formal legal and drug controller regulatory approval.", CARD_BG, BORDER_COLOR),
        ("Community Trust & Adoption", "Safe peer exchange relies on active community participation and mutual verification during physical handover.", CARD_BG, BORDER_COLOR),
    ]

    for idx, (l_title, l_desc, l_bg, l_border) in enumerate(limits):
        col = idx % 3
        row = idx // 3
        left_pos = Inches(0.8 + col * 3.95)
        top_pos = Inches(1.5 + row * 2.65)
        add_card(s17, left_pos, top_pos, Inches(3.8), Inches(2.45), l_title, l_desc, bg_color=l_bg, border_color=l_border)

    add_footer(s17, 17)
    add_speaker_notes(s17, "Sumukh Bhat", "1.5 mins", [
        "Be completely transparent about project boundaries with the evaluation committee.",
        "Explain that acknowledging limitations shows mature engineering judgment.",
        "Emphasize the intentional exclusion of cold-chain drugs and the prototype status."
    ])

    # ==========================================================================
    # SLIDE 18: SCALABILITY & FUTURE ROADMAP
    # ==========================================================================
    s18 = prs.slides.add_slide(blank_layout)
    set_slide_background(s18)
    add_header(s18, "Scalability Architecture & Future Roadmap", "Scalability Engineering", "Speaker: Sumukh Bhat")

    # Left: Implemented Today
    add_card(s18, Inches(0.8), Inches(1.5), Inches(5.7), Inches(5.2), "Implemented Today (MVP Architecture)", "Stable foundation validated in automated test suites", bg_color=EMERALD_BG, border_color=EMERALD)
    curr_arch = [
        "Stateless Express 5 REST API: Enables horizontal load distribution across multiple instances.",
        "Indexed MongoDB Collections: Compound indexes on status, locality, seller, and timestamps for sub-10ms queries.",
        "Local Isolated Document Storage: Private filesystem storage with authenticated streaming access.",
        "Deterministic Pune Locality Model: Pre-computed coordinates and Haversine proximity calculations.",
        "Offline Resilient AI Layer: Curated knowledge base prevents API dependency bottlenecks."
    ]
    add_bullet_list(s18, Inches(1.0), Inches(2.2), Inches(5.3), Inches(4.3), curr_arch, font_size=10, spacing=8)

    # Right: Planned Future Architecture
    add_card(s18, Inches(6.8), Inches(1.5), Inches(5.7), Inches(5.2), "Planned Future Architecture (Production Scale)", "Engineering enhancements for institutional deployment", bg_color=CARD_BG, border_color=BORDER_COLOR)
    future_arch = [
        "Cloud Object Storage: AWS S3 / GCP Cloud Storage with encrypted short-lived signed URLs for prescriptions.",
        "Redis Caching Layer: High-speed caching for public medicine search and locality proximity lookups.",
        "Asynchronous Background Queues: BullMQ / Celery for automated donor email & SMS handover notifications.",
        "OCR Prescription Extraction: Tesseract / Vision AI for automatic doctor registration number validation.",
        "Multi-City GeoJSON Sharding: Dynamic geo-fencing across Mumbai, Bangalore, and Delhi."
    ]
    add_bullet_list(s18, Inches(7.0), Inches(2.2), Inches(5.3), Inches(4.3), future_arch, font_size=10, spacing=8)

    add_footer(s18, 18)
    add_speaker_notes(s18, "Sumukh Bhat", "1.5 mins", [
        "Answer Judge Question 6 regarding system scalability.",
        "Compare current stateless architecture with future enterprise enhancements (S3, Redis, OCR).",
        "Clearly separate what is implemented today from future scope."
    ])

    # ==========================================================================
    # SLIDE 19: COMMUNITY IMPACT & ACADEMIC VALUE
    # ==========================================================================
    s19 = prs.slides.add_slide(blank_layout)
    set_slide_background(s19)
    add_header(s19, "Community Engagement Impact & Stakeholder Value", "Community Impact", "Speaker: Sumukh Bhat")

    # 4 Stakeholder Cards
    stakeholders = [
        ("Medicine Donors / Sellers", "Can responsibly list unexpired surplus medications, avoiding waste and contributing to community health equity.", TEAL_LIGHT, TEAL_PRIMARY, [
            "Simplified AI-assisted listing in under 2 minutes",
            "Transparent community pricing formula",
            "Flexible local handover point selection"
        ]),
        ("Recipients / Patients", "Can discover verified unexpired medications at structured non-profit rates close to their residential locality.", EMERALD_BG, EMERALD, [
            "Savings of 40%–65% compared to retail MRP",
            "Proximity transparency avoids distant trips",
            "Prescription security protects patient privacy"
        ]),
        ("Campus Coordinators / Admins", "Have centralized moderation tools to inspect listings, verify prescriptions, and oversee safe exchanges.", PURPLE_BG, PURPLE, [
            "Dual-queue approval dashboard",
            "Detailed rejection reason tracking",
            "Complete transaction audit log"
        ]),
        ("College Campus / Community", "Establishes a circular healthcare model reducing pharmaceutical pollution in urban wastewater.", AMBER_BG, AMBER, [
            "Reduces unused medicine expiration in homes",
            "Promotes responsible medication reuse",
            "Ideal for campus pilot health drives"
        ]),
    ]

    for idx, (sh_t, sh_sub, sh_bg, sh_border, sh_items) in enumerate(stakeholders):
        col = idx % 2
        row = idx // 2
        left_p = Inches(0.8 + col * 5.95)
        top_p = Inches(1.5 + row * 2.65)
        add_card(s19, left_p, top_p, Inches(5.75), Inches(2.45), sh_t, sh_sub, bg_color=sh_bg, border_color=sh_border)
        add_bullet_list(s19, left_p + Inches(0.15), top_p + Inches(1.0), Inches(5.45), Inches(1.3), sh_items, font_size=9.5, spacing=4)

    add_footer(s19, 19)
    add_speaker_notes(s19, "Sumukh Bhat", "1.5 mins", [
        "Answer Judge Question 7: Who benefits from MEDISAVE?",
        "Walk through the 4 stakeholders: Donors, Recipients, Coordinators, and Community/Campus.",
        "Highlight the environmental benefit of reducing pharmaceutical waste."
    ])

    # ==========================================================================
    # SLIDE 20: LIVE DEMONSTRATION FLOW
    # ==========================================================================
    s20 = prs.slides.add_slide(blank_layout)
    set_slide_background(s20)
    add_header(s20, "Live Demonstration Walkthrough Sequence", "Live Demonstration", "Speaker: Sumukh Bhat")

    demo_steps = [
        ("Step 1: Donor Listing Flow", "List 'Dolomide' → AI autofills salt formulation → Enter MRP ₹68 & Expiry → Deterministic suggested price ₹32 displayed with rationale → Submit to pending queue.", TEAL_LIGHT, TEAL_PRIMARY),
        ("Step 2: Admin Moderation", "Coordinator logs in → Inspects pending listing & batch number → Approves listing → Moderates uploaded PDF prescription with validity date tagging.", PURPLE_BG, PURPLE),
        ("Step 3: Buyer Discovery", "Recipient selects locality 'Hinjewadi' → Views proximity badges ('Nearby · 2.1 km' vs 'Far from you · 20.4 km') → Sorts by 'Nearby First'.", EMERALD_BG, EMERALD),
        ("Step 4: Cart & Handover", "Add to multi-seller cart → Attach approved prescription → Select 'Agreed Public Point (College Gate)' → Place order with atomic stock decrement.", AMBER_BG, AMBER),
    ]

    for idx, (d_title, d_desc, d_bg, d_border) in enumerate(demo_steps):
        top_pos = Inches(1.5 + idx * 1.3)
        add_card(s20, Inches(0.8), top_pos, Inches(11.733), Inches(1.15), d_title, d_desc, bg_color=d_bg, border_color=d_border)

    add_footer(s20, 20)
    add_speaker_notes(s20, "Sumukh Bhat", "1.5 mins", [
        "Guide the committee through the live demonstration sequence.",
        "Demonstrate the 4 core highlights: AI autofill, Coordinator approval, Proximity sorting, and Handover checkout.",
        "Ensure transitions between screens are smooth."
    ])

    # ==========================================================================
    # SLIDE 21: CONCLUSION & GITHUB REPOSITORY
    # ==========================================================================
    s21 = prs.slides.add_slide(blank_layout)
    set_slide_background(s21)

    add_card(s21, Inches(0.8), Inches(0.8), Inches(11.733), Inches(5.8), bg_color=CARD_BG, border_color=BORDER_COLOR)

    tb = s21.shapes.add_textbox(Inches(1.2), Inches(1.2), Inches(10.9), Inches(1.8))
    tf = tb.text_frame
    tf.word_wrap = True
    
    p0 = tf.paragraphs[0]
    p0.text = "MEDISAVE: Summary & Conclusion"
    p0.font.name = "Segoe UI"
    p0.font.size = Pt(28)
    p0.font.bold = True
    p0.font.color.rgb = TEAL_PRIMARY

    p1 = tf.add_paragraph()
    p1.text = "A community medicine exchange platform where discovery, verification, transparent pricing, and local coordination work together."
    p1.font.name = "Segoe UI"
    p1.font.size = Pt(14)
    p1.font.bold = True
    p1.font.color.rgb = TEXT_PRIMARY
    p1.space_before = Pt(6)

    # 3 Summary Cards
    conclusions = [
        ("Proximity-Aware Handover", "Deterministic Haversine distance solves the Katraj vs Hinjewadi challenge without unrealistic courier claims.", TEAL_LIGHT, TEAL_PRIMARY),
        ("Deterministic Pricing Engine", "Mathematical shelf-life formulas and server-side 85% MRP cap ensure fair non-profit community pricing.", EMERALD_BG, EMERALD),
        ("Verified Compliance & Security", "Schedule H prescription verification, authenticated document streaming, and 369 automated test assertions.", PURPLE_BG, PURPLE),
    ]

    for idx, (c_t, c_d, c_bg, c_border) in enumerate(conclusions):
        left_pos = Inches(1.2 + idx * 3.65)
        add_card(s21, left_pos, Inches(2.8), Inches(3.5), Inches(2.2), c_t, c_d, bg_color=c_bg, border_color=c_border)

    # GitHub & Academic Info Box
    tb_bot = s21.shapes.add_textbox(Inches(1.2), Inches(5.2), Inches(10.9), Inches(1.2))
    tf_bot = tb_bot.text_frame
    tf_bot.word_wrap = True
    
    p_gh = tf_bot.paragraphs[0]
    p_gh.text = "GitHub Repository: https://github.com/Vidyang07/medisave"
    p_gh.font.name = "Segoe UI"
    p_gh.font.size = Pt(12)
    p_gh.font.bold = True
    p_gh.font.color.rgb = TEAL_PRIMARY

    p_team = tf_bot.add_paragraph()
    p_team.text = "Team: Ronit Subhedar (21270), Vidyang Wagh (21282), Darshan Solanke (21269), Sumukh Bhat (21271)  |  PICT Pune  •  SY 2 (H2)"
    p_team.font.name = "Segoe UI"
    p_team.font.size = Pt(10)
    p_team.font.color.rgb = TEXT_MUTED
    p_team.space_before = Pt(4)

    add_footer(s21, 21)
    add_speaker_notes(s21, "Sumukh Bhat", "1.5 mins", [
        "Deliver the final concluding remarks.",
        "Reiterate the core achievement: Discovery, Verification, Transparent Pricing, and Local Handover.",
        "Thank the evaluation committee and open the floor for questions."
    ])

    # ==========================================================================
    # SLIDE 22: JUDGE Q&A RAPID-RESPONSE CHEAT SHEET
    # ==========================================================================
    s22 = prs.slides.add_slide(blank_layout)
    set_slide_background(s22)
    add_header(s22, "Evaluation Committee Q&A Reference Guide", "Judge Preparation", "All Team Members")

    qa_list = [
        ("Q1: Katraj ↔ Hinjewadi Delivery?", "We do not operate a courier fleet. Proximity engine tags it as 'Far from you (20.4 km)' and prioritizes closer listings (Katraj ↔ Bibvewadi = 2.1 km) for public landmark handover."),
        ("Q2: How is Price Decided?", "Deterministic policy based on printed MRP and remaining shelf life (>12 mo = 40% off, 6-12 mo = 50% off, 3-6 mo = 65% off, <90 days = rejected) with an 85% maximum MRP cap."),
        ("Q3: What if AI is Wrong/Offline?", "AI is strictly an assistant for name normalization. Printed MRP is ground truth. Offline pharmaceutical knowledge base activates instantly on API failure (12/12 tested)."),
        ("Q4: Prescription Safety (Rx)?", "Schedule H drugs require coordinator review of uploaded doctor prescriptions (PDF/JPG/PNG <= 5MB) before checkout. IDOR protected and privately streamed."),
        ("Q5: Preventing Fake Listings?", "Dual moderation queue: Listings default to 'pending' and are hidden from buyers until coordinator audits batch number, expiry date (>= 90 days), and seal condition."),
        ("Q6: Prototype vs Production?", "This is an academic CEP prototype. Real-world deployment would require drug controller regulatory approval, cloud storage (S3), and campus health center collection hubs.")
    ]

    for idx, (q_t, q_a) in enumerate(qa_list):
        col = idx % 2
        row = idx // 2
        left_pos = Inches(0.8 + col * 5.95)
        top_pos = Inches(1.5 + row * 1.75)
        add_card(s22, left_pos, top_pos, Inches(5.75), Inches(1.6), q_t, q_a, bg_color=CARD_BG, border_color=BORDER_COLOR)

    add_footer(s22, 22)
    add_speaker_notes(s22, "All Team Members", "Reference", [
        "Keep this slide ready during the Q&A session.",
        "Each team member can reference the exact technical policy when answering faculty questions.",
        "Maintain confidence and strict adherence to actual implementation."
    ])

    output_path = "C:\\medisave\\MEDISAVE_CEP_Presentation.pptx"
    prs.save(output_path)
    print(f"Successfully generated MEDISAVE presentation at: {output_path}")

if __name__ == "__main__":
    create_presentation()
