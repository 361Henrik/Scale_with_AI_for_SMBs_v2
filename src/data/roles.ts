export const roles: Record<string, any> = {
  meeting: {
    no: {
      label: "Møteassistent",
      challenge:
        "Mye tid går med til å skrive referater, fange opp beslutninger og fordele aksjonspunkter etter møter.",
      ai:
        "En AI-støttet møteassistent transkriberer samtalen, oppsummerer hovedpunktene, og lister opp beslutninger og neste steg automatisk.",
      human:
        "Mennesket styrer møtet, sikrer at de riktige beslutningene tas, og kvalitetssikrer at AI-ens oppsummering fanger opp nyansene.",
      beforeAfter:
        "Før: En deltaker må bruke tid på å notere og renskrive referat i etterkant. Etter: Referat og aksjonspunkter er klare umiddelbart etter møtet.",
      workflow: [
        "Ta opp møtet med et transkripsjonsverktøy.",
        "La AI generere et strukturert referat med hovedpunkter.",
        "Be AI trekke ut alle beslutninger og aksjonspunkter med ansvarlig person.",
        "Se over referatet for å sikre at tonen og nyansene er riktige.",
        "Del referatet med deltakerne umiddelbart."
      ],
      example: {
        prompt:
          "Her er transkripsjonen fra ukens statusmøte. Lag et kort referat med de tre viktigste diskusjonspunktene, en liste over beslutninger, og en tabell med aksjonspunkter, hvem som er ansvarlig, og frist.",
        answer:
          "Dette frigjør tid for alle møtedeltakere og sikrer at ingenting faller mellom stolene, samtidig som fremdriften opprettholdes."
      },
      recommendation:
        "Dette er et utmerket startpunkt for alle bedrifter, da det gir umiddelbar tidsbesparelse og er svært enkelt å implementere."
    },
    en: {
      label: "Meeting assistant",
      challenge:
        "A lot of time is spent writing minutes, capturing decisions, and assigning action items after meetings.",
      ai:
        "An AI-supported meeting assistant transcribes the conversation, summarizes the main points, and automatically lists decisions and next steps.",
      human:
        "Humans lead the meeting, ensure the right decisions are made, and quality-check that the AI's summary captures the nuances.",
      beforeAfter:
        "Before: One participant has to spend time taking notes and writing up minutes afterwards. After: Minutes and action items are ready immediately after the meeting.",
      workflow: [
        "Record the meeting using a transcription tool.",
        "Let AI generate structured minutes with key takeaways.",
        "Ask AI to extract all decisions and action items with the responsible person.",
        "Review the minutes to ensure tone and nuances are correct.",
        "Share the minutes with participants immediately."
      ],
      example: {
        prompt:
          "Here is the transcript from this week's status meeting. Create a short summary with the three most important discussion points, a list of decisions, and a table with action items, who is responsible, and the deadline.",
        answer:
          "This frees up time for all meeting participants and ensures nothing falls through the cracks, while maintaining momentum."
      },
      recommendation:
        "This is an excellent starting point for all companies, as it provides immediate time savings and is very easy to implement."
    }
  },
  document: {
    no: {
      label: "Dokumentbehandler",
      challenge:
        "Ansatte bruker mye tid på å lese gjennom lange dokumenter, kontrakter eller anbud for å finne spesifikk informasjon eller oppsummere innholdet.",
      ai:
        "En AI-støttet dokumentbehandler kan raskt analysere store tekstmengder, trekke ut nøkkelinformasjon, identifisere risikoer og lage sammendrag.",
      human:
        "Mennesket vurderer informasjonen, tar de strategiske beslutningene basert på funnene, og håndterer komplekse unntak.",
      beforeAfter:
        "Før: Timer med manuell lesing for å finne de viktigste klausulene eller kravene. Etter: AI gir deg en strukturert oversikt på sekunder, slik at du kan fokusere på vurderingen.",
      workflow: [
        "Last opp lange dokumenter, PDF-er eller anbudstekster til en sikker AI-løsning.",
        "Be AI om å oppsummere hovedinnholdet i et kort format.",
        "Spør AI om spesifikke detaljer, for eksempel 'Hva er betalingsbetingelsene?' eller 'Hvilke frister nevnes?'.",
        "La AI flagge potensielle risikoer eller avvik fra standardvilkår.",
        "Bruk innsikten til å ta raskere og mer informerte beslutninger."
      ],
      example: {
        prompt:
          "Les gjennom denne 50-siders kontrakten. Oppsummer de viktigste forpliktelsene for vår part, list opp alle tidsfrister, og flagg eventuelle uvanlige ansvarsbegrensninger.",
        answer:
          "Dette reduserer tiden brukt på informasjonsinnhenting drastisk, og lar fagpersoner bruke ekspertisen sin på analyse og forhandling."
      },
      recommendation:
        "Svært verdifullt for roller som håndterer mye tekst, som jurister, selgere, prosjektledere og saksbehandlere."
    },
    en: {
      label: "Document processor",
      challenge:
        "Employees spend a lot of time reading through long documents, contracts, or tenders to find specific information or summarize the content.",
      ai:
        "An AI-supported document processor can quickly analyze large volumes of text, extract key information, identify risks, and create summaries.",
      human:
        "Humans evaluate the information, make strategic decisions based on the findings, and handle complex exceptions.",
      beforeAfter:
        "Before: Hours of manual reading to find the most important clauses or requirements. After: AI gives you a structured overview in seconds, allowing you to focus on the assessment.",
      workflow: [
        "Upload long documents, PDFs, or tender texts to a secure AI solution.",
        "Ask AI to summarize the main content in a short format.",
        "Ask AI for specific details, such as 'What are the payment terms?' or 'What deadlines are mentioned?'.",
        "Let AI flag potential risks or deviations from standard terms.",
        "Use the insights to make faster and more informed decisions."
      ],
      example: {
        prompt:
          "Read through this 50-page contract. Summarize the main obligations for our party, list all deadlines, and flag any unusual limitations of liability.",
        answer:
          "This drastically reduces the time spent on information retrieval, allowing experts to use their skills on analysis and negotiation."
      },
      recommendation:
        "Highly valuable for roles handling a lot of text, such as lawyers, sales representatives, project managers, and caseworkers."
    }
  },
  content: {
    no: {
      label: "Innholdsprodusent",
      challenge:
        "Det tar mye tid å produsere engasjerende innhold til sosiale medier, nyhetsbrev og nettsider, noe som ofte fører til at markedsføringen nedprioriteres.",
      ai:
        "En AI-støttet innholdsprodusent genererer utkast til artikler, sosiale medier-innlegg og nyhetsbrev basert på stikkord, tidligere innhold og bedriftens tone-of-voice.",
      human:
        "Mennesket eier strategien, godkjenner innholdet, sikrer at det stemmer overens med merkevaren, og publiserer det.",
      beforeAfter:
        "Før: Skrivesperre og timer brukt på å formulere én artikkel. Etter: Førsteutkast er klart på minutter, og tiden brukes på redigering og finpuss.",
      workflow: [
        "Definer målgruppe og budskap for innholdet.",
        "Gi AI stikkord eller et tidligere dokument som utgangspunkt.",
        "La AI generere 3 ulike utkast med ulik tone.",
        "Velg det beste utkastet og gjør manuelle justeringer.",
        "Publiser innholdet i valgte kanaler."
      ],
      example: {
        prompt:
          "Skriv et engasjerende LinkedIn-innlegg om vår nye bærekraftsrapport. Bruk en profesjonell, men entusiastisk tone. Inkluder tre hovedfunn og avslutt med et spørsmål til leserne.",
        answer:
          "Dette sikrer jevn og høy kvalitet på kommunikasjonen utad, selv i perioder med høy arbeidsbelastning."
      },
      recommendation:
        "Ideelt for bedrifter som ønsker å øke sin synlighet på nett uten å måtte ansette et stort markedsføringsteam."
    },
    en: {
      label: "Content creator",
      challenge:
        "Producing engaging content for social media, newsletters, and websites takes a lot of time, often leading to marketing being deprioritized.",
      ai:
        "An AI-supported content creator generates drafts for articles, social media posts, and newsletters based on keywords, previous content, and the company's tone of voice.",
      human:
        "Humans own the strategy, approve the content, ensure it aligns with the brand, and publish it.",
      beforeAfter:
        "Before: Writer's block and hours spent drafting a single article. After: First drafts are ready in minutes, and time is spent on editing and polishing.",
      workflow: [
        "Define the target audience and message for the content.",
        "Give AI keywords or a previous document as a starting point.",
        "Let AI generate 3 different drafts with varying tones.",
        "Choose the best draft and make manual adjustments.",
        "Publish the content in the chosen channels."
      ],
      example: {
        prompt:
          "Write an engaging LinkedIn post about our new sustainability report. Use a professional yet enthusiastic tone. Include three key findings and end with a question for the readers.",
        answer:
          "This ensures consistent and high-quality external communication, even during periods of high workload."
      },
      recommendation:
        "Ideal for companies looking to increase their online visibility without having to hire a large marketing team."
    }
  },
  customer: {
    no: {
      label: "Kundeservice",
      challenge:
        "Kundeservice bruker mye tid på å svare på de samme standardspørsmålene, noe som gir lengre ventetid for komplekse henvendelser.",
      ai:
        "En AI-støttet kundebehandler analyserer innkommende henvendelser, foreslår svar basert på tidligere historikk og kunnskapsbaser, og kan håndtere enkle spørsmål automatisk.",
      human:
        "Mennesket tar over komplekse saker, bygger relasjoner med kundene, og håndterer situasjoner som krever empati og skjønn.",
      beforeAfter:
        "Før: Innboksen renner over av enkle spørsmål om åpningstider og returvilkår. Etter: AI håndterer 60% av volumet, mens teamet løser de virkelige problemene.",
      workflow: [
        "Koble AI til bedriftens innboks og kunnskapsbase.",
        "La AI kategorisere og prioritere innkommende e-poster.",
        "AI foreslår et svar som kundebehandleren kan godkjenne med ett klikk.",
        "For komplekse saker, gir AI et sammendrag av kundens historikk.",
        "Kundebehandleren tar over og løser saken personlig."
      ],
      example: {
        prompt:
          "Kunden spør om status på ordre #12345. Sjekk systemet, se at pakken er forsinket, og skriv et høflig svar som beklager forsinkelsen og gir ny estimert leveringsdato.",
        answer:
          "Dette gir raskere responstid for kundene og en mer givende arbeidshverdag for kundeserviceteamet."
      },
      recommendation:
        "Anbefales sterkt for bedrifter med høyt volum av kundehenvendelser og standardiserte prosesser."
    },
    en: {
      label: "Customer service",
      challenge:
        "Customer service spends a lot of time answering the same standard questions, resulting in longer wait times for complex inquiries.",
      ai:
        "An AI-supported customer service agent analyzes incoming inquiries, suggests answers based on past history and knowledge bases, and can handle simple questions automatically.",
      human:
        "Humans take over complex cases, build relationships with customers, and handle situations that require empathy and judgment.",
      beforeAfter:
        "Before: The inbox overflows with simple questions about opening hours and return policies. After: AI handles 60% of the volume, while the team solves the real problems.",
      workflow: [
        "Connect AI to the company's inbox and knowledge base.",
        "Let AI categorize and prioritize incoming emails.",
        "AI suggests an answer that the agent can approve with one click.",
        "For complex cases, AI provides a summary of the customer's history.",
        "The agent takes over and resolves the case personally."
      ],
      example: {
        prompt:
          "The customer is asking about the status of order #12345. Check the system, see that the package is delayed, and write a polite reply apologizing for the delay and providing a new estimated delivery date.",
        answer:
          "This provides faster response times for customers and a more rewarding workday for the customer service team."
      },
      recommendation:
        "Highly recommended for companies with a high volume of customer inquiries and standardized processes."
    }
  },
  reporting: {
    no: {
      label: "Rapportering og analyse",
      challenge:
        "Å samle inn data fra ulike systemer og bygge månedlige rapporter er en manuell, feilutsatt og tidkrevende prosess.",
      ai:
        "En AI-støttet analytiker trekker ut data fra regneark og systemer, identifiserer trender, og genererer ferdige rapporter med visualiseringer og innsikt.",
      human:
        "Mennesket definerer hvilke KPI-er som er viktige, tolker AI-ens funn i en forretningskontekst, og fatter strategiske beslutninger.",
      beforeAfter:
        "Før: Dager brukes på å klippe og lime data i Excel. Etter: Rapporten genereres automatisk, og tiden brukes på å forstå hva tallene betyr.",
      workflow: [
        "Last opp rådata eller koble AI til bedriftens datakilder.",
        "Be AI om å sammenstille tallene for forrige måned.",
        "La AI identifisere avvik, trender og forbedringsområder.",
        "Gå gjennom rapporten og legg til strategiske kommentarer.",
        "Del den ferdige rapporten med ledelsen eller styret."
      ],
      example: {
        prompt:
          "Analyser salgsdataene for Q3. Lag et sammendrag som viser veksten sammenlignet med Q2, identifiser de tre bestselgende produktene, og foreslå årsaker til eventuelle nedganger i spesifikke regioner.",
        answer:
          "Dette flytter fokuset fra datainnsamling til datadrevet beslutningstaking, noe som gir et enormt konkurransefortrinn."
      },
      recommendation:
        "Kritisk for ledere og økonomiteam som trenger oppdatert styringsinformasjon uten forsinkelser."
    },
    en: {
      label: "Reporting and analysis",
      challenge:
        "Gathering data from various systems and building monthly reports is a manual, error-prone, and time-consuming process.",
      ai:
        "An AI-supported analyst extracts data from spreadsheets and systems, identifies trends, and generates finished reports with visualizations and insights.",
      human:
        "Humans define which KPIs are important, interpret the AI's findings in a business context, and make strategic decisions.",
      beforeAfter:
        "Before: Days are spent copying and pasting data in Excel. After: The report is generated automatically, and time is spent understanding what the numbers mean.",
      workflow: [
        "Upload raw data or connect AI to the company's data sources.",
        "Ask AI to compile the numbers for the previous month.",
        "Let AI identify anomalies, trends, and areas for improvement.",
        "Review the report and add strategic commentary.",
        "Share the finished report with management or the board."
      ],
      example: {
        prompt:
          "Analyze the sales data for Q3. Create a summary showing the growth compared to Q2, identify the three best-selling products, and suggest reasons for any declines in specific regions.",
        answer:
          "This shifts the focus from data collection to data-driven decision-making, providing a massive competitive advantage."
      },
      recommendation:
        "Critical for managers and finance teams who need updated management information without delays."
    }
  },
  onboarding: {
    no: {
      label: "Nyansatt-opplæring",
      challenge:
        "Opplæring av nye ansatte krever mye tid fra nøkkelpersonell, og informasjonen er ofte spredt på tvers av ulike dokumenter og systemer.",
      ai:
        "En AI-støttet onboarding-assistent fungerer som en interaktiv mentor som kan svare på spørsmål om rutiner, systemer og kultur basert på bedriftens håndbøker.",
      human:
        "Mennesket bygger den sosiale relasjonen, overfører taus kunnskap, og sørger for at den nyansatte føler seg velkommen i teamet.",
      beforeAfter:
        "Før: Senioransatte blir stadig avbrutt for å svare på hvor man finner maler eller hvordan reiseregninger fungerer. Etter: Den nyansatte spør AI-en først, og får umiddelbare, korrekte svar.",
      workflow: [
        "Samle personalhåndbok, rutinebeskrivelser og maler i en AI-kunnskapsbase.",
        "Gi den nyansatte tilgang til AI-assistenten fra dag én.",
        "La den nyansatte stille spørsmål i naturlig språk (f.eks. 'Hvordan bestiller jeg IT-utstyr?').",
        "AI gir et presist svar med lenker til relevante systemer.",
        "Lederen bruker tiden på 1-til-1-samtaler om mål og utvikling."
      ],
      example: {
        prompt:
          "Jeg er ny i salgsteamet. Kan du gi meg en steg-for-steg guide til hvordan jeg registrerer en ny kunde i CRM-systemet, og hvilke maler jeg skal bruke for det første møtet?",
        answer:
          "Dette gir en tryggere og raskere oppstart for den nyansatte, samtidig som det beskytter tiden til erfarne kollegaer."
      },
      recommendation:
        "Spesielt verdifullt for bedrifter i vekst som ansetter jevnlig og trenger å standardisere opplæringen."
    },
    en: {
      label: "Onboarding",
      challenge:
        "Training new employees requires a lot of time from key personnel, and information is often scattered across various documents and systems.",
      ai:
        "An AI-supported onboarding assistant acts as an interactive mentor that can answer questions about routines, systems, and culture based on company handbooks.",
      human:
        "Humans build the social relationship, transfer tacit knowledge, and ensure the new employee feels welcome in the team.",
      beforeAfter:
        "Before: Senior staff are constantly interrupted to answer where to find templates or how travel expenses work. After: The new hire asks the AI first and gets immediate, correct answers.",
      workflow: [
        "Gather the employee handbook, routine descriptions, and templates in an AI knowledge base.",
        "Give the new hire access to the AI assistant from day one.",
        "Let the new hire ask questions in natural language (e.g., 'How do I order IT equipment?').",
        "AI provides a precise answer with links to relevant systems.",
        "The manager spends time on 1-on-1 conversations about goals and development."
      ],
      example: {
        prompt:
          "I am new to the sales team. Can you give me a step-by-step guide on how to register a new customer in the CRM system, and which templates I should use for the first meeting?",
        answer:
          "This provides a safer and faster start for the new employee, while protecting the time of experienced colleagues."
      },
      recommendation:
        "Especially valuable for growing companies that hire regularly and need to standardize training."
    }
  }
};
