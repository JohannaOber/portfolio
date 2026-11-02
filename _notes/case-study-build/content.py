# New case-study texts per project. Values are (en, de) or plain en (no German yet).
# 'steps' gives the accordion titles in order for the numbered process blocks.
# simple=True: no decisions, no accordion; Problem/Approach/Result reuse the
# original Challenge/Process/Solution texts word for word (incl. German).

P = {}

P[1] = dict(
    meta=['Hochschule der Medien', ('Academic project', 'Akademisches Projekt'), '2024'],
    no_about=True,  # the original lead now serves as the summary sentence
    lead=("Mobile companion app for Germany's national education platform, helping students discover and navigate their options.",
          "Mobile Begleit-App für Deutschlands nationale Bildungsplattform, die Lernenden hilft, ihre Möglichkeiten zu entdecken und sich darin zurechtzufinden."),
    role_head=['UX/UI design', 'User interviews', 'Journey mapping', 'Wireframing'],
    problem=("A search engine is not enough",
             "BIRD (Bildungsraum Digital) is Germany's federally funded platform for discovering educational programs and institutions. Its web prototype needed a mobile companion. Interviews with high school students showed that a search engine alone does not help: they need personalisation and guidance."),
    approach=("A companion, not a catalogue",
              "We mapped the journey of education seekers and defined the core features: personalised content via the BIRD Wallet, intelligent search, a personal notebook and the BIRD chatbot for real-time support. From a moodboard and paper wireframes we iterated toward high-fidelity screens and tested the prototype with students."),
    result=("A personal space with a hands-on character",
            "The app brings Germany's education options into one place, with individual content, space for personal notes and support on the go. Students praised the prototype for clarity and ease of navigation, and the concept was under further consideration as part of the national BIRD platform."),
    decisions=[
        ("Guidance over search", "Interviews revealed that students were missing orientation, not options. So personalisation via the BIRD Wallet and the chatbot became the core of the app.", None),
        ("A paper-inspired look", "The visual language, inspired by paper and handwriting, feels familiar and approachable for younger users and communicates quality through texture and tactility.", None),
    ],
    steps=["Discovery: the user's journey", "Define: defining flow &amp; features", "Design: wireframe to high-fidelity", "Test: usability testing"],
    role="In a team of two, my tasks were:",
    chips=["User interviews", "Journey mapping", "Feature definition", "Wireframing", "UI design", "Prototyping"],
)

P[2] = dict(
    meta=['Audi AG', ("Bachelor's thesis", 'Bachelorarbeit'), '2025'],
    no_about=True,  # the original lead now serves as the summary sentence
    lead=("A thesis project for Audi AG exploring how personal smart devices can become the core of the Level 5 autonomous driving experience. Specific content is confidential, so this page focuses on the process.",
          "Eine Abschlussarbeit für die Audi AG, die untersucht, wie persönliche Smart Devices zum Mittelpunkt des autonomen Fahrerlebnisses auf Level 5 werden können. Konkrete Inhalte sind vertraulich, daher steht hier der Prozess im Mittelpunkt."),
    role_short='Sole designer',
    problem=("No steering wheel, no driver",
             "In a Level 5 autonomous future, driving is no longer the user's task. How can a personal smart device enable a seamless travel experience that adapts to individual needs and societal shifts?"),
    approach=("Designing from future scenarios",
              "I researched autonomous vehicle technology, passenger behaviour and mobility trends, and identified the trends expected to shape everyday life once Level 5 becomes reality. A holistic concept was built around three personas and their travel situations, then prototyped through sketches and videos and evaluated by a mixed group of experts."),
    result=("A base for further exploration",
            "While details remain confidential, the concept places the personal smart device at the heart of the in-car experience, built for a passenger, not a driver. The focus group responded positively and named expanding it to further user groups as a valuable next step."),
    decisions=[
        ("The personal device at the core", "Familiar device interactions instead of a new system in the car, adapted to the autonomous travel context.", None),
        ("Designing for future scenarios", "Level 5 vehicles do not exist yet, so the design space was defined through scenario-based thinking and the trends expected for that time.",
         "Trade-off: the concept was closely tied to a specific persona, which the focus group pointed out itself."),
        ("Expert focus group instead of user tests", "There is no Level 5 car to test in, so key scenarios were shown as sketches and videos to a mixed group of experts.", None),
    ],
    steps=["Research: no steering wheel, no driver", "Synthesis: framing the opportunity", "Concept: designing the experience", "Prototype: expert focus group"],
    role="As the sole designer, my tasks were:",
    chips=["Trend research", "Scenarios", "Personas", "Concept", "Interaction design", "Sketching", "Video prototyping", "Expert focus group"],
)

P[3] = dict(
    meta=['Akkodis', ('Internal project', 'Internes Projekt'), '2023'],
    lead="Used e-bikes come without a trustworthy history. We designed an app that records it on the blockchain, without users having to know what that is.",
    role_head=['User flows', 'Design system', 'Logo', 'UI design'],
    problem=("No trust in used e-bikes",
             "Buying or selling a used e-bike comes with uncertainty: no verified history of ownership, maintenance or accidents. The real challenge was making blockchain technology accessible to everyday users, communicating security and trust without technical jargon."),
    approach=("Hiding the blockchain behind familiar flows",
              "Building on a colleague’s research and the blockchain architecture, we defined three core flows: registering a bike, maintaining the digital logbook and transferring ownership. We created the logo, a modular design system based on the Akkodis CI and all screens, then refined the prototype after an internal review."),
    result=("A tamper-proof logbook in your pocket",
            "The dApp shows any registered e-bike’s history, from previous owners to workshop visits, and ownership transfers happen directly between parties, without middlemen. After further iterations, the prototype became a reference project for internal innovation at Akkodis."),
    decisions=[
        ("Keep the complex technology invisible", "Users should experience security and simplicity first, so the design avoids technical jargon and relies on clarity, neutral tones and clean typography.", None),
        ("Only three core flows", "Registering a bike, the digital logbook and the ownership transfer cover what buyers and sellers actually need, and keep the blockchain complexity out of sight.", None),
    ],
    steps=["Discovery: onboarding from external research", "Define: translating tech into UX flows", "Design: the app’s identity", "Test: prototype review and refinement"],
    role="In a team of two, my tasks were:",
    chips=["Research synthesis", "User flows", "Logo", "Design system", "UI design", "Prototyping"],
)

P[4] = dict(
    simple=True,
    meta=['Akkodis', ('Internal project', 'Internes Projekt'), '2023'],
    lead="After a merger, the learning platform still wore the old brand. I rebuilt its components so learning and course creation got faster.",
    role_short='Sole designer',
    headings=["New brand, old platform", "Audit, define, rebuild", "A modular foundation for focused learning"],
    role="As the sole designer, my tasks were:",
    chips=["UI audit", "Usability review", "Component library", "Brand application", "Figma"],
)

P[5] = dict(
    meta=['Linköping University', 'Visualiseringscenter C', '2024'],
    lead="At 14, falling in love is confusing and embarrassing to ask about. We turned it into an exhibit where visitors examine a love-sick patient.",
    role_head=['Research', 'Scene development', 'Physical interaction concept', 'Technical integration'],
    problem=("Making the science of love feel personal",
             "The Visualiseringscenter C in Norrköping invites student teams to develop interactive science exhibits for young audiences. Our brief: explain the biology and psychology of falling in love in a way that is engaging, relatable and safe to explore, even for teenagers who might not admit they are curious."),
    approach=("Roleplay across two body halves",
              "We researched the biology and psychology of falling in love and the questions teens have with first romantic feelings. The exhibit centres on a love-struck patient: the left body half explores the biological mechanisms, the right the emotional experience. Visitors become nurses and examine the patient with a tangible stethoscope, while a doctor narrates the findings."),
    result=("The museum’s favourite student project",
            "LOVEsick received outstanding feedback from educators and visitors for its creativity, educational clarity and emotional resonance. The Visualiseringscenter C selected it as their favourite student project, with potential for integration into the permanent exhibition."),
    decisions=[
        ("Roleplay instead of explanation", "As a nurse, visitors examine someone else instead of talking about their own feelings, which turns an embarrassing topic into something warm, funny and safe.", None),
        ("Two halves, free entry point", "The left side answers ‘How does it work?’, the right side ‘What does it feel like?’. Visitors choose where to start, which creates curiosity without prescribing a single path.", None),
        ("A tangible stethoscope", "A physical object to examine the patient with makes the interaction, and the topic, memorable.", None),
    ],
    steps=["Discovery: research and target group", "Define: dual-sided narrative structure", "Design: tangible interaction and roleplay", "Test: Watchout prototype evaluation"],
    role="In a team of six, my tasks were:",
    chips=["Research", "Ideation", "Scene development", "Physical interaction concept", "Technical integration", "Exhibit programming"],
)

P[6] = dict(
    simple=True,
    meta=['Akkodis', ('Internal project', 'Internes Projekt'), '2024'],
    lead="Akkodis needed a believable EV cockpit to demo its driving simulator. I designed it as a modular library, ready for animation and 3D.",
    role_short='Sole designer',
    headings=["Customer-tailored simulations", "White-label components", "Modular and brand-ready"],
    role="As the sole designer, my tasks were:",
    chips=["Benchmarking", "HMI design", "Component library", "States and variants", "Handoff"],
)

P[7] = dict(
    simple=True,
    meta=['Akkodis', ('Internal project', 'Internes Projekt'), '2023'],
    lead="Every brand posts the same Halloween look. We made the ghost the user, and showed what user-centered design really means.",
    role_short='Sole designer',
    headings=["A Halloween post with a point", "Ghost-centered design", "Message received"],
    role="As the sole designer, my tasks were:",
    chips=["Concept", "Illustration", "Motion design", "Social media"],
)

P[8] = dict(
    no_about=True,  # the original lead is no longer needed here
    meta=['Linköping University', ('Course project', 'Kursprojekt'), '2024'],
    lead=("A third of all food is wasted, and there are plenty of opportunities to reduce it. We developed a playful way to empower kids with the knowledge to do so, produced sustainably from what already exists.",
          "Ein Drittel aller Lebensmittel landet im Müll, dabei gibt es viele Möglichkeiten, das zu ändern. Wir haben einen spielerischen Weg entwickelt, Kindern das Wissen dafür mitzugeben, nachhaltig hergestellt aus dem, was es schon gibt."),
    role_head=[('Character design', 'Character Design'), ('Illustration', 'Illustration'), ('Print design', 'Printdesign'), ('AR animation', 'AR-Animation')],
    problem=(("Too much of our food goes to waste", "Zu viele unserer Lebensmittel landen im Müll"),
             ("One third of all food produced globally is wasted, and changing that starts at home. Everyday life offers so many small opportunities to reduce it, and by making each other aware of them, we can make a big difference together.",
              "Ein Drittel aller weltweit produzierten Lebensmittel wird verschwendet, und Veränderung beginnt zu Hause. Der Alltag bietet viele kleine Ansatzpunkte, das zu reduzieren, und wenn wir uns gegenseitig darauf aufmerksam machen, können wir gemeinsam Großes bewirken.")),
    approach=(("Simple, playful, sustainable", "Einfach, spielerisch, nachhaltig"),
              ("We wanted to reach even the youngest with something that empowers instead of lectures: no extra resources or money needed, no hurdle to get started, accessible right away and learned through play.",
               "Wir wollten schon die Kleinsten erreichen, mit etwas, das sie stärkt, statt sie zu belehren: ohne zusätzliche Ressourcen oder Kosten, ohne Hürde beim Einstieg, sofort zugänglich und spielerisch zu lernen.")),
    result=(("Learning in the bag", "Wissen zum Mitnehmen"),
            ("A cooperative board game printed on a standard ICA grocery bag, with an AR companion app that brings the food characters to life. Players rescue expiring food from the waste bin, and the game reaches families at the moment food decisions are made. Faculty saw SDG 12 addressed in a concrete, age-appropriate way, and instructors wanted to see it in actual supermarkets.",
             "Ein kooperatives Brettspiel, gedruckt auf eine normale ICA-Einkaufstüte, mit einer AR-App, die die Lebensmittel-Figuren zum Leben erweckt. Die Spielenden retten ablaufende Lebensmittel vor dem Mülleimer, und das Spiel erreicht Familien genau dann, wenn Entscheidungen über Lebensmittel fallen. Die Lehrenden sahen SDG 12 hier konkret und altersgerecht umgesetzt und wünschten sich das Spiel in echten Supermärkten.")),
    decisions=[
        (("The grocery bag as the board", "Die Einkaufstüte als Spielbrett"),
         ("No extra purchase or materials needed, and the game reaches families exactly when they shop.",
          "Kein Zusatzkauf und kein extra Material, und das Spiel erreicht Familien genau beim Einkaufen."), None),
        (("Cooperative, not competitive", "Miteinander statt gegeneinander"),
         ("Players solve shared tasks together, including donating food to players in need. Sustainability is not explained, it is played.",
          "Die Spielenden lösen Aufgaben gemeinsam und spenden zum Beispiel Lebensmittel an Mitspielende, die welche brauchen. Nachhaltigkeit wird nicht erklärt, sondern gespielt."), None),
        (("AR as a reason to replay", "AR als Grund, wieder zu spielen"),
         ("During playtesting, the AR feature generated immediate excitement and became a strong motivator for repeat play.",
          "Beim Playtesting sorgte die AR-Funktion sofort für Begeisterung und wurde zu einem starken Anreiz, das Spiel noch einmal zu spielen."), None),
    ],
    # Define.png holds sketches (top) and characters/cards (bottom): show each part where it belongs
    media_override={
        2: ['<div class="cs-crop cs-crop--top" style="aspect-ratio: 1696 / 700"><img loading="lazy" decoding="async" src="images/project-8-little-food-fighters/Define.png" alt="Little Food Fighters: Define, sketches" /></div>'],
        3: ['<div class="cs-crop cs-crop--bottom" style="aspect-ratio: 1696 / 902"><img loading="lazy" decoding="async" src="images/project-8-little-food-fighters/Define.png" alt="Little Food Fighters: characters and game cards" /></div>',
            '<img loading="lazy" decoding="async" src="images/project-8-little-food-fighters/Mockup_Bag_mFlappe_2.jpg" alt="Little Food Fighters: bag mockup with flap detail" />'],
    },
    steps=["Discovery: the impact of kids", "Define: mechanics and format", "Design: illustration, print and AR", "Test: playtesting with kids"],
    role=("In a team of four, my tasks were:", "Im Viererteam waren meine Aufgaben:"),
    chips=[("Research", "Recherche"), ("Game mechanics", "Spielmechanik"), ("Character design", "Character Design"), ("Illustration", "Illustration"),
           ("Print design", "Printdesign"), ("AR animation", "AR-Animation"), ("Playtesting", "Playtesting")],
)

P[10] = dict(
    meta=[('Personal project', 'Persönliches Projekt'), '2026'],
    no_about=True,  # the original lead now serves as the summary sentence
    lead=("A mobile-first concept for AI-assisted vote counting on election night, designed to work within Germany's existing paper ballot system.",
          "Ein Mobile-First-Konzept für KI-gestützte Stimmenauszählung am Wahlabend, entwickelt für das bestehende Wahlsystem mit Papierstimmzetteln in Deutschland."),
    role_short='Sole designer',
    problem=("No time to learn a complex system",
             "At a local election in 2025, I worked as a volunteer poll worker and experienced the newly introduced digital counting system firsthand: unclear terminology, buried actions and a flow slower than pen and paper. For a tool used once a year, under time pressure and with no training, that is not acceptable."),
    approach=("Three roles, one seamless flow",
              "I spoke with fellow poll workers, who confirmed my experience. The concept digitises only the counting behind the scenes and connects three roles: poll worker at the entrance, vote counter at the table and municipal administration. Each sees only what they need, labelled with the terminology they already know."),
    result=("Ready to pitch",
            "Fellow poll workers who reviewed the prototype responded immediately: clear, fast, and something they would use that same night. The next step is pitching the concept to the responsible municipal office."),
    decisions=[
        ("Keep the paper ballot", "In Germany, paper ballots deliberately include voters who cannot or should not have to use digital systems. Only the counting becomes digital, the voter experience stays unchanged.", None),
        ("QR code instead of logins", "Access works via QR code, so volunteers need no account and no training.", None),
        ("AI suggests, people confirm", "AI reads the ballot photo and suggests a result, and the human confirms or corrects it: quicker than counting by hand, and safer because a person always has the final say.", None),
    ],
    steps=["Research: no time to learn a system", "Concept: a solution that does not exclude voters", ("Design: as simple &amp; safe as possible", "Design: so einfach und sicher wie möglich")],
    role="As the sole designer, my tasks were:",
    chips=["Field observation", "Interviews", "Concept", "Flow design", "UI design", "AI interaction design", "Prototyping"],
)

P[11] = dict(
    title='ELLA: Lifelong Learning with AI',
    meta=[('European Commission', 'Europäische Kommission'), ('University of Oulu', 'Universität Oulu'), 'Titanom Solutions GmbH', '2026'],
    no_about=True,  # the original lead now serves as the summary sentence
    lead=("An international EU research project investigating how self-regulated learning can be sustainably embedded in everyday classroom instruction.",
          "Ein internationales EU-Forschungsprojekt, das untersucht, wie selbstreguliertes Lernen nachhaltig im Unterrichtsalltag verankert werden kann."),
    role_short='Sole UX designer',
    problem='original',  # the Challenge text is short enough to keep word for word
    approach=("More structure than design",
              "The ELLA team analysed 122 research papers, ran a student survey and brought together 16 learning experts from across Europe. I introduced the stakeholders to the design process, prioritised the findings with them in workshops, built personas and journey maps and guided the ideation. Schemas showed how the solution fits into curricula, existing systems and different types of lessons."),
    result=("Built for real classrooms",
            "When I left the project, the first prototype was ready for user tests with teachers and students, and the project is committed to long-term continuation. With €400,000 in EU funding and schools from multiple countries involved from day one, it is built for real deployment."),
    decisions=[
        ("Finding out what stops teachers", "Teachers already knew the principle of SRL and wanted to use it, but simply had no time for it. So the research question became what was actually stopping it in everyday lessons.", None),
        ("Bringing stakeholders into the design process", "I introduced them to how we move from the problem space to the solution space, how a design cycle works and how users are involved in testing. Along the way, they learned to trust the process from discovery to design.", None),
        ("Experts as co-designers", "In workshops, the experts uncovered problems with me, generated solutions and prioritised them. In regular feedback rounds, we evaluated interim results together, and they contributed ideas for further use cases and user groups.", None),
    ],
    steps=["Research: a comprehensive insight", "Concept: supporting the learning journeys", "Design: “more structure than design”", "Test and iterate: built to be validated"],
    role="As the sole UX designer, working with learning experts and stakeholders across Europe, my tasks were:",
    chips=["Stakeholder onboarding", "Workshop facilitation", "Research synthesis", "Personas", "Journey mapping", "Ideation", "Prioritisation", "Concept", "Information architecture", "User test planning"],
)


# ── Overview pass: problem only the problem, approach only the core idea
#    (the process lives in the accordion), result only the outcome ──
P[1]['problem'] = ("A search engine is not enough",
    "Choosing an education path at 17 is overwhelming. BIRD (Bildungsraum Digital), Germany’s federally funded platform for educational programs and institutions, existed only as a web prototype, and a search alone does not help students: they need personalisation and guidance.")
P[1]['approach'] = ("Personalised and guided",
    "Instead of just listing options, we wanted to create familiarity, personalisation and a companion who meets students on their level and accompanies them through their whole journey.")
P[1]['result'] = ("A personal space with a hands-on character",
    "A mobile companion that brings all education options into one place: personalised content via the BIRD Wallet, a notebook for favourites and notes, and a chatbot for support on the go. Its paper-inspired design gives it a familiar, hands-on character. Students praised the prototype for clarity and ease of navigation, and the concept was under further consideration as part of the national BIRD platform.")

P[2]['approach'] = ("Designing from future scenarios",
    "Level 5 cars do not exist yet, so I designed from the future: the trends expected to shape everyday life by then and the travel situations passengers will find themselves in, with the personal smart device at the centre of the experience.")

P[3]['approach'] = ("Highly technical processes made easy",
    "Keep the technology in the background: three core flows, registering a bike, keeping the digital logbook and transferring ownership, built on familiar and trustworthy interactions instead of technical jargon.")

P[5]['approach'] = ("The emotional and sensory experience",
    "Instead of explaining, we let visitors play: they become nurses and examine a love-struck patient. One body half shows the biology, the other the feelings, so visitors explore the topic without having to talk about themselves.")
P[5]['result'] = ("The museum’s favourite student project",
    "An interactive exhibit where visitors examine a fictional patient with a tangible stethoscope, while a doctor’s voiceover guides them with warmth and humour. It received outstanding feedback from educators and visitors, and the Visualiseringscenter C selected it as their favourite student project, with potential for integration into the permanent exhibition.")

P[10]['approach'] = ("ASSAP: As simple &amp; safe as possible",
    "Keep the existing system, including the paper ballot, and make only the counting digital. AI helps read the ballots, but whenever it is unsure, a person decides; in the background, it also checks that the counted results match up. Poll workers, vote counters and the municipal administration share one flow, yet none of them depends on another to get their part done.")
P[10]['result'] = ("Ready to pitch",
    "A concept and prototype that volunteers can use without any training. Fellow poll workers who reviewed it responded immediately: clear, fast, and something they would use that same night. The next step is pitching it to the responsible municipal office.")

P[11]["approach"] = ("Structure shapes awareness",
    "We focussed on how self-regulated learning fits into curricula, existing systems and different types of lessons. A clear structure builds awareness of SRL step by step, so the methods can be implemented smoothly in everyday teaching, without extra work. Learning experts and stakeholders were part of the design process from the start.")

P[11]['problem'] = (("Stuck in the theory", "In der Theorie stecken geblieben"),
    ("Teachers across Europe want to bring self-regulated learning into the classroom, but most have no time to read into the methods, or to apply them. Students, in turn, are rarely even aware of SRL as a concept. Individual support stays out of reach for both sides.",
     "Lehrkräfte in ganz Europa möchten selbstreguliertes Lernen in den Unterricht bringen, doch den meisten fehlt die Zeit, sich in die Methoden einzulesen oder sie anzuwenden. Schülerinnen und Schülern ist SRL als Konzept wiederum kaum bekannt. Individuelle Unterstützung bleibt so für beide Seiten außer Reichweite."))

# BIRD: usability testing was done by my teammate, not by me
P[1]['body_override'] = {4: (
    "My teammate tested the interactive prototype with a small group of students. Feedback confirmed the value of the personalisation layer and the chatbot, and led to refinements in the notebook and search interactions. The paper-inspired visual style was consistently well-received.",
    "Meine Teamkollegin hat den interaktiven Prototyp mit einer kleinen Gruppe von Schülerinnen und Schülern getestet. Das Feedback bestätigte den Mehrwert der Personalisierung und des Chatbots und führte zu Verbesserungen beim Notizbuch und bei der Suche. Der papierinspirierte Stil kam durchweg gut an.")}

# BIRD only: the two images in the strip share one height (widths by aspect ratio)
P[1]['equal_height_gallery'] = True


# The original short description (former lead) serves as the sentence under the
# title; the extra description paragraph below it is dropped
P[3].update(no_about=True, lead=(
    "A decentralized app making e-bike ownership transparent, with a blockchain-based tamper-proof digital logbook and secure peer-to-peer ownership transfers.",
    "Eine dezentrale App, die den Besitz von E-Bikes transparent macht: mit einem fälschungssicheren digitalen Logbuch auf Blockchain-Basis und sicheren Peer-to-Peer-Eigentumsübertragungen."))
P[4].update(no_about=True, lead=(
    "Redesigning Akkodis's internal learning platform after a company merger, aligning brand identity, improving usability, and rebuilding the component library.",
    "Redesign der internen Lernplattform von Akkodis nach einer Unternehmensfusion: Angleichung an die neue Markenidentität, bessere Usability und eine neu aufgebaute Komponentenbibliothek."))
P[6].update(no_about=True, lead=(
    "A modular, brand-aligned EV cockpit interface built for Akkodis's internal driving simulation software.",
    "Ein modulares, markenkonformes Cockpit-Interface für Elektrofahrzeuge, entwickelt für die interne Fahrsimulationssoftware von Akkodis."))
P[7].update(no_about=True, lead=(
    "A Halloween motion piece for Akkodis's UX team, to send a creative greeting to clients while highlighting the value of good UX.",
    "Ein Halloween-Motion-Piece für das UX-Team von Akkodis, das kreative Grüße an Kunden sendet und dabei zeigt, was gute UX wert ist."))

# AKKAdemy: approach as the core idea, not the step-by-step process
P[4]['approach_body'] = (
    "Instead of a pure visual refresh, I audited every UI component against the new brand guidelines, prioritised the set for the platform’s core workflows and rebuilt the entire library, with clear naming conventions, layout rules and the Akkodis CI applied consistently throughout.",
    "Statt nur das Design aufzufrischen, habe ich alle UI-Komponenten mit den neuen Brand Guidelines abgeglichen, sie für die zentralen Workflows der Plattform priorisiert und die gesamte Bibliothek neu aufgebaut, mit klaren Naming Conventions, Layout-Regeln und durchgängig in der Akkodis-CI.")

# LOVEsick: the sketches move from the image strip into 02 Define, before the step's own image
P[5]['gallery_exclude'] = ['01.02.33.jpg']
P[5]['media_override'] = {2: [
    '<img loading="lazy" decoding="async" src="images/project-5-lovesick/Bildschirmfoto 2024-04-22 um 01.02.33.jpg" alt="LOVEsick: sketches" />',
    '<img loading="lazy" decoding="async" src="images/project-5-lovesick/Bildschirmfoto 2024-04-22 um 01.04.49.jpg" alt="LOVEsick: Narrative structure" />']}
# LOVEsick: two photos of the tested exhibit, side by side and equal height, before the step's own image
P[5]['media_override'][4] = []  # the two test photos moved to the image strip
# LOVEsick: the former test image now sits in 03 Design, after the step's own image
P[5]['media_override'][3] = [
    '<img loading="lazy" decoding="async" src="images/project-5-lovesick/Bildschirmfoto 2024-04-22 um 01.06.54.png" alt="LOVEsick: Prototype evaluation" />',
    '<img loading="lazy" decoding="async" src="images/project-5-lovesick/project-5-design-shaky-limbs.png" alt="LOVEsick: screens How does it work, Shaky limbs, What does it feel like" />',
    '<img loading="lazy" decoding="async" src="images/project-5-lovesick/project-5-design-doctor.png" alt="LOVEsick: the doctor reassures the patient" />']

# LOVEsick: the image strip shows only the hearts banner, full width (moved out of 03 Design)
P[5]['gallery_override'] = ['<img src="images/project-5-lovesick/Bildschirmfoto 2024-04-22 um 01.06.04.png" alt="LOVEsick: hearts" />']

# LOVEsick: image strip = hearts banner (full width), below it the two exhibit photos side by side, same height
P[5]['gallery_raw'] = """
  <div class="cs-gallery cs-gallery--rows">
    <div class="cs-gallery-row">
      <div class="cs-gallery-item" style="flex: 1 1 0"><img loading="lazy" decoding="async" src="images/project-5-lovesick/Bildschirmfoto 2024-04-22 um 01.06.04.png" alt="LOVEsick: hearts" /></div>
    </div>
    <div class="cs-gallery-row">
      <div class="cs-gallery-item" style="flex: 1.3228 1 0"><img loading="lazy" decoding="async" src="images/project-5-lovesick/project-5-test-stethoscope.jpg" alt="LOVEsick: a visitor examines the patient with the stethoscope" /></div>
      <div class="cs-gallery-item" style="flex: 0.7497 1 0"><img loading="lazy" decoding="async" src="images/project-5-lovesick/project-5-test-setup.jpg" alt="LOVEsick: exhibit setup with screens and the patient" /></div>
    </div>
  </div>
"""

# HMI: the cockpit image is cropped at the sides to the format of the image next to it, so both are equally high
P[6]['gallery_crop'] = {'HMI_86kmh.png': '2000 / 1126'}

# Horror Mode: the storyboard is cropped on its right side to the ghost image's format, so both are equally high
P[7]['gallery_crop'] = {'project-7-storyboard.jpg': ('2400 / 1351', 'left')}

# Horror Mode: the animation is the cover, as a normal video with controls (starts on click);
# the former cover image takes the video's place in the image strip
P[7]['cover_html'] = ('<video src="images/project-7-horror-mode/project-7-video.mp4" '
                      'poster="images/project-7-horror-mode/project-7-video-poster.jpg" '
                      'controls playsinline preload="metadata" aria-label="The Horror Mode: Animation"></video>')
P[7]['gallery_swap'] = {'project-7-video.mp4':
    '<img src="images/project-7-horror-mode/project-7-1.png" alt="The Horror Mode" />'}

# Horror Mode: only the storyboard in the image strip (full width, uncropped)
P[7]['gallery_raw'] = """
  <div class="cs-gallery cs-gallery--rows">
    <div class="cs-gallery-row">
      <div class="cs-gallery-item" style="flex: 1 1 0"><img loading="lazy" decoding="async" src="images/project-7-horror-mode/project-7-storyboard.jpg" alt="The Horror Mode: Storyboard" /></div>
    </div>
  </div>
"""

# Little Food Fighters: the kids photo is cropped at the sides to the bag image's format, so both are equally high
P[8]['gallery_crop'] = {'project-8-3.jpg': '2000 / 1500'}

# ELLA: the classroom photo is cropped at the sides to the box image's format, so both are equally high
P[11]['gallery_crop'] = {'project-11-classroom.png': '4000 / 3000'}
