import type { ResumeData } from "@/types/resume";

/**
 * Escape special LaTeX characters in text
 * @param text - Text to escape
 * @returns LaTeX-safe text
 */
function escapeLatex(text: string): string {
  if (!text) return "";
  return (
    text
      .replace(/\\/g, "\\textbackslash{}")
      .replace(/~/g, "\\textasciitilde{}")
      .replace(/\^/g, "\\textasciicircum{}")
      .replace(/#/g, "\\#")
      .replace(/\$/g, "\\$")
      .replace(/%/g, "\\%")
      .replace(/&/g, "\\&")
      .replace(/_/g, "\\_")
      .replace(/{/g, "\\{")
      .replace(/}/g, "\\}")
      // Fix double backslash issues that might have been created
      .replace(/\\textbackslash\{\}textbackslash\{\}/g, "\\textbackslash{}")
      .replace(/\\textasciitilde\{\}textasciitilde\{\}/g, "\\textasciitilde{}")
      .replace(
        /\\textasciicircum\{\}textasciicircum\{\}/g,
        "\\textasciicircum{}",
      )
  );
}

/**
 * Generate LaTeX document from resume data
 * @param data - Resume data object containing education, experience, projects, etc.
 * @returns Complete LaTeX document string
 */
export function generateLatexFromData(data: ResumeData): string {
  // LaTeX preamble
  const preamble = `%-------------------------
% Resume in Latex
% Auto-generated from form data
%------------------------

\\documentclass[letterpaper,11pt]{article}

\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}
\\usepackage{fontawesome5}
\\usepackage{multicol}
\\setlength{\\multicolsep}{-3.0pt}
\\setlength{\\columnsep}{-1pt}
\\input{glyphtounicode}

\\pagestyle{fancy}
\\fancyhf{} % clear all header and footer fields
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

% Adjust margins
\\addtolength{\\oddsidemargin}{-0.6in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1.19in}
\\addtolength{\\topmargin}{-.7in}
\\addtolength{\\textheight}{1.4in}

\\urlstyle{same}

\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

% Sections formatting
\\titleformat{\\section}{
  \\vspace{-4pt}\\scshape\\raggedright\\large\\bfseries
}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]

% Ensure that generate pdf is machine readable/ATS parsable
\\pdfgentounicode=1

%-------------------------
% Custom commands
\\newcommand{\\resumeItem}[1]{
  \\item\\small{
    {#1 \\vspace{-2pt}}
  }
}

\\newcommand{\\classesList}[4]{
    \\item\\small{
        {#1 #2 #3 #4 \\vspace{-2pt}}
  }
}

\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
    \\begin{tabular*}{1.0\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & \\textbf{\\small #2} \\\\
      \\textit{\\small#3} & \\textit{\\small #4} \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeSubSubheading}[2]{
    \\item
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\textit{\\small#1} & \\textit{\\small #2} \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeProjectHeading}[2]{
    \\item
    \\begin{tabular*}{1.001\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\small#1 & \\textbf{\\small #2}\\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeSubItem}[1]{\\resumeItem{#1}\\vspace{-4pt}}

\\renewcommand\\labelitemi{$\\vcenter{\\hbox{\\tiny$\\bullet$}}$}
\\renewcommand\\labelitemii{$\\vcenter{\\hbox{\\tiny$\\bullet$}}$}

\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.0in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}

%-------------------------------------------
%%%%%%  RESUME STARTS HERE  %%%%%%%%%%%%%%%%%%%%%%%%%%%%


\\begin{document}

`;

  // Heading section
  let headingSection = "";
  if (data.personalInfo) {
    const info = data.personalInfo;
    headingSection = "%----------HEADING----------\n";
    headingSection += "\\begin{center}\n";
    headingSection += `    {\\Huge \\scshape ${escapeLatex(info.name || "First Last")}} \\\\ \\vspace{1pt}\n`;

    if (info.address) {
      headingSection += `    ${escapeLatex(info.address)} \\\\ \\vspace{1pt}\n`;
    }

    const contactLine: string[] = [];
    if (info.phone) {
      contactLine.push(
        `\\small \\raisebox{-0.1\\height}\\faPhone\\ ${escapeLatex(info.phone)}`,
      );
    }
    if (info.email) {
      contactLine.push(
        `\\href{mailto:${escapeLatex(info.email)}}{\\raisebox{-0.2\\height}\\faEnvelope\\  \\underline{${escapeLatex(info.email)}}}`,
      );
    }
    if (info.linkedin) {
      const linkedinUrl = info.linkedin.startsWith("http")
        ? info.linkedin
        : `https://linkedin.com/in/${info.linkedin}`;
      contactLine.push(
        `\\href{${escapeLatex(linkedinUrl)}}{\\raisebox{-0.2\\height}\\faLinkedin\\ \\underline{${escapeLatex(info.linkedin)}}}`,
      );
    }
    if (info.github) {
      const githubUrl = info.github.startsWith("http")
        ? info.github
        : `https://github.com/${info.github}`;
      contactLine.push(
        `\\href{${escapeLatex(githubUrl)}}{\\raisebox{-0.2\\height}\\faGithub\\ \\underline{${escapeLatex(info.github)}}}`,
      );
    }

    if (contactLine.length > 0) {
      headingSection += `    ${contactLine.join(" ~ ")}\n`;
    }

    headingSection += "    \\vspace{-8pt}\n";
    headingSection += "\\end{center}\n\n\n";
  }

  // Education section
  let educationSection = "";
  if (data.education.length > 0) {
    educationSection =
      "%-----------EDUCATION-----------\n\\section{Education}\n  \\resumeSubHeadingListStart\n";
    data.education
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .forEach((edu) => {
        educationSection += `    \\resumeSubheading\n`;
        educationSection += `      {${escapeLatex(edu.universityName || "University Name")}}{${escapeLatex(edu.datesAttended || "Dates")}}\n`;
        educationSection += `      {${escapeLatex(edu.degree || "Degree")}}{${escapeLatex(edu.location || "Location")}}\n`;
      });
    educationSection += "  \\resumeSubHeadingListEnd\n\n";
  }

  // Coursework section
  let courseworkSection = "";
  const courseworkItems = data.education
    .filter((edu) => edu.coursework && edu.coursework.trim())
    .flatMap((edu) =>
      edu
        .coursework!.split(",")
        .map((course) => course.trim())
        .filter(Boolean),
    );
  if (courseworkItems.length > 0) {
    courseworkSection =
      "%------RELEVANT COURSEWORK-------\n\\section{Relevant Coursework}\n    %\\resumeSubHeadingListStart\n        \\begin{multicols}{4}\n            \\begin{itemize}[itemsep=-5pt, parsep=3pt]\n";
    courseworkItems.forEach((course) => {
      courseworkSection += `                \\item\\small ${escapeLatex(course)}\n`;
    });
    courseworkSection +=
      "            \\end{itemize}\n        \\end{multicols}\n        \\vspace*{2.0\\multicolsep}\n    %\\resumeSubHeadingListEnd\n\n\n";
  }

  // Experience section
  let experienceSection = "";
  if (data.experience.length > 0) {
    experienceSection =
      "%-----------EXPERIENCE-----------\n\\section{Experience}\n  \\resumeSubHeadingListStart\n\n";
    data.experience
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .forEach((exp) => {
        experienceSection += `    \\resumeSubheading\n`;
        experienceSection += `      {${escapeLatex(exp.company || "Company")}}{${escapeLatex(exp.dates || "Dates")}}\n`;
        experienceSection += `      {${escapeLatex(exp.jobTitle || "Job Title")}}{${escapeLatex(exp.location || "Location")}}\n`;
        if (exp.description) {
          const bullets = exp.description
            .split("\n")
            .map((line) => line.replace(/^[•\-]\s*/, "").trim())
            .filter(Boolean);

          // Only add itemize environment if there are actual bullet points
          if (bullets.length > 0) {
            experienceSection += `      \\resumeItemListStart\n`;
            bullets.forEach((bullet) => {
              experienceSection += `        \\resumeItem{${escapeLatex(bullet)}}\n`;
            });
            experienceSection += `      \\resumeItemListEnd\n\n`;
          }
        }
      });
    experienceSection += "  \\resumeSubHeadingListEnd\n";
    experienceSection += "\\vspace{-16pt}\n\n";
  }

  // Projects section
  let projectsSection = "";
  if (data.projects.length > 0) {
    projectsSection =
      "%-----------PROJECTS-----------\n\\section{Projects}\n    \\vspace{-5pt}\n    \\resumeSubHeadingListStart\n";
    data.projects
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .forEach((proj, idx) => {
        projectsSection += `      \\resumeProjectHeading\n`;
        projectsSection += `          {\\textbf{${escapeLatex(proj.projectName || "Project Name")}} $|$ \\emph{${escapeLatex(proj.technologies || "Technologies")}}}{${escapeLatex(proj.date || "Date")}}\n`;
        if (proj.description) {
          const bullets = proj.description
            .split("\n")
            .map((line) => line.replace(/^[•\-]\s*/, "").trim())
            .filter(Boolean);

          // Only add itemize environment if there are actual bullet points
          if (bullets.length > 0) {
            projectsSection += `          \\resumeItemListStart\n`;
            bullets.forEach((bullet) => {
              projectsSection += `            \\resumeItem{${escapeLatex(bullet)}}\n`;
            });
            projectsSection += `          \\resumeItemListEnd\n`;
            if (idx < data.projects.length - 1) {
              projectsSection += "          \\vspace{-13pt}\n";
            }
          }
        }
      });
    projectsSection += "    \\resumeSubHeadingListEnd\n";
    projectsSection += "\\vspace{-15pt}\n\n\n";
  }

  // Technical Skills section
  let skillsSection = "";
  if (
    data.technicalSkills.languages ||
    data.technicalSkills.developerTools ||
    data.technicalSkills.technologiesFrameworks
  ) {
    skillsSection =
      "%\n%-----------PROGRAMMING SKILLS-----------\n\\section{Technical Skills}\n \\begin{itemize}[leftmargin=0.15in, label={}]\n    \\small{\\item{\n";
    if (data.technicalSkills.languages) {
      skillsSection += `     \\textbf{Languages}{: ${escapeLatex(data.technicalSkills.languages)}} \\\\\n`;
    }
    if (data.technicalSkills.developerTools) {
      skillsSection += `     \\textbf{Developer Tools}{: ${escapeLatex(data.technicalSkills.developerTools)}} \\\\\n`;
    }
    if (data.technicalSkills.technologiesFrameworks) {
      skillsSection += `     \\textbf{Technologies/Frameworks}{: ${escapeLatex(data.technicalSkills.technologiesFrameworks)}} \\\\\n`;
    }
    skillsSection += "    }}\n \\end{itemize}\n \\vspace{-16pt}\n\n\n";
  }

  //   %-----------INVOLVEMENT---------------
  // \section{Leadership / Extracurricular}
  //     \resumeSubHeadingListStart
  //         \resumeSubheading{Fraternity}{Spring 2020 -- Present}{President}{University Name}
  //             \resumeItemListStart
  //                 \resumeItem{Achieved a 4 star fraternity ranking by the Office of Fraternity and Sorority Affairs (highest possible ranking).}
  //                 \resumeItem{Managed executive board of 5 members and ran weekly meetings to oversee progress in essential parts of the chapter.}
  //                 \resumeItem{Led chapter of 30+ members to work towards goals that improve and promote community service, academics, and unity.}
  //             \resumeItemListEnd

  //     \resumeSubHeadingListEnd

  // Leadership section
  let leadershipSection = "";
  if (data.leadership.length > 0) {
    leadershipSection =
      "%-----------INVOLVEMENT---------------\n\\section{Leadership / Extracurricular}\n    \\resumeSubHeadingListStart\n";
    data.leadership
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .forEach((lead) => {
        leadershipSection += `        \\resumeSubheading{${escapeLatex(lead.organization || "Organization")}}{${escapeLatex(lead.dates || "Dates")}}\n`;
        leadershipSection += `            {${escapeLatex(lead.role || "Role")}}{}\n`;
        if (lead.description) {
          const bullets = lead.description
            .split("\n")
            .map((line) => line.replace(/^[•\-]\s*/, "").trim())
            .filter(Boolean);

          // Only add itemize environment if there are actual bullet points
          if (bullets.length > 0) {
            leadershipSection += `            \\resumeItemListStart\n`;
            bullets.forEach((bullet) => {
              leadershipSection += `                \\resumeItem{${escapeLatex(bullet)}}\n`;
            });
            leadershipSection += `            \\resumeItemListEnd\n`;
          }
        }
        leadershipSection += "\n";
      });
    leadershipSection += "    \\resumeSubHeadingListEnd\n\n\n";
  }

  const ending = "\\end{document}\n";

  return (
    preamble +
    headingSection +
    educationSection +
    courseworkSection +
    experienceSection +
    projectsSection +
    skillsSection +
    leadershipSection +
    ending
  );
}
