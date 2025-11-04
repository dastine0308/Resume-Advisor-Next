"use client";

import React, { useState } from "react";
import { Navigation } from "@/components/resume/Navigation";
import { ProgressBar } from "@/components/resume/ProgressBar";
import { Breadcrumb } from "@/components/resume/Breadcrumb";
import { SectionCard } from "@/components/resume/SectionCard";
import { FormField } from "@/components/resume/FormField";
import { Button } from "@/components/ui/Button";
import type {
  ResumeData,
  Education,
  Experience,
  Project,
  Leadership,
} from "@/types/resume";

export default function ContentBuilderPage() {
  const [resumeData, setResumeData] = useState<ResumeData>({
    education: [
      {
        id: "1",
        universityName: "State University",
        degree: "Bachelor of Science in Computer Science",
        location: "City, State",
        datesAttended: "Sep. 2017 – May 2021",
        coursework:
          "Data Structures, Software Methodology, Algorithms Analysis, Database Management, Artificial Intelligence, Internet Technology, Systems Programming, Computer Architecture",
      },
    ],
    experience: [
      {
        id: "1",
        jobTitle: "Software Engineer Intern",
        company: "Electronics Company",
        location: "City, State",
        dates: "May 2020 – August 2020",
        achievements:
          "• Developed a service to automatically perform a set of unit tests daily on a product in development in order to decrease time needed for team members to identify and fix bugs/issues.\n• Incorporated scripts using Python and PowerShell to aggregate XML test results into an organized format and to load the latest build code onto the hardware, so that daily testing can be performed.\n• Utilized Jenkins to provide a continuous integration service in order to automate the entire process of loading the latest build code and test files, running the tests, and generating a report of the results once per day.\n• Explored ways to visualize and send a daily report of test results to team members using HTML, Javascript, and CSS.",
      },
      {
        id: "2",
        jobTitle: "Front End Developer Intern",
        company: "Startup, Inc",
        location: "City, State",
        dates: "May 2019 – August 2019",
        achievements:
          "• Assisted in development of the front end of a mobile application for iOS/Android using Dart and the Flutter framework.\n• Worked with Google Firebase to manage user inputted data across multiple platforms including web and mobile apps.\n• Collaborated with team members using version control systems such as Git to organize modifications and assign tasks.\n• Utilized Android Studio as a development environment in order to visualize the application in both iOS and Android.",
      },
    ],
    projects: [
      {
        id: "1",
        projectName: "Gym Reservation Bot",
        technologies: "Python, Selenium, Google Cloud Console",
        date: "January 2021",
        description:
          "• Developed an automatic bot using Python and Google Cloud Console to register myself for a timeslot at my school gym.\n• Implemented Selenium to create an instance of Chrome in order to interact with the correct elements of the web page.\n• Created a Linux virtual machine to run on Google Cloud so that the program is able to run everyday from the cloud.\n• Used Cron to schedule the program to execute automatically at 11 AM every morning so a reservation is made for me.",
      },
      {
        id: "2",
        projectName: "Ticket Price Calculator App",
        technologies: "Java, Android Studio",
        date: "November 2020",
        description:
          "• Created an Android application using Java and Android Studio to calculate ticket prices for trips to museums in NYC.\n• Processed user inputted information in the back-end of the app to return a subtotal price based on the tickets selected.\n• Utilized the layout editor to create a UI for the application in order to allow different scenes to interact with each other.",
      },
      {
        id: "3",
        projectName: "Transaction Management GUI",
        technologies: "Java, Eclipse, JavaFX",
        date: "October 2020",
        description:
          "• Designed a sample banking transaction system using Java to simulate the common functions of using a bank account.\n• Used JavaFX to create a GUI that supports actions such as creating an account, deposit, withdraw, list all accounts, etc.\n• Implemented object-oriented programming practices such as inheritance to create different account types and databases.",
      },
    ],
    leadership: [
      {
        id: "1",
        role: "President",
        organization: "Fraternity",
        dates: "Spring 2020 – Present",
        achievements:
          "• Achieved a 4-star fraternity ranking by the Office of Fraternity and Sorority Affairs (highest possible ranking).\n• Managed executive board of 5 members and ran weekly meetings to oversee progress in essential parts of the chapter.\n• Led chapter of 30+ members to work towards goals that improve and promote community service, academics, and unity.",
      },
    ],
    technicalSkills: {
      languages: "Python, Java, C, HTML/CSS, JavaScript, SQL",
      developerTools: "VS Code, Eclipse, Google Cloud Platform, Android Studio",
      technologiesFrameworks: "Linux, Jenkins, GitHub, JUnit, WordPress",
    },
  });

  const breadcrumbItems = [
    { label: "Contact Info", active: false },
    { label: "Education", active: false },
    { label: "Experience", active: true },
    { label: "Projects", active: false },
    { label: "Skills", active: false },
    { label: "Leadership", active: false },
  ];

  const updateEducation = (
    id: string,
    field: keyof Education,
    value: string,
  ) => {
    setResumeData((prev) => ({
      ...prev,
      education: prev.education.map((edu) =>
        edu.id === id ? { ...edu, [field]: value } : edu,
      ),
    }));
  };

  const updateExperience = (
    id: string,
    field: keyof Experience,
    value: string,
  ) => {
    setResumeData((prev) => ({
      ...prev,
      experience: prev.experience.map((exp) =>
        exp.id === id ? { ...exp, [field]: value } : exp,
      ),
    }));
  };

  const updateProject = (id: string, field: keyof Project, value: string) => {
    setResumeData((prev) => ({
      ...prev,
      projects: prev.projects.map((proj) =>
        proj.id === id ? { ...proj, [field]: value } : proj,
      ),
    }));
  };

  const updateLeadership = (
    id: string,
    field: keyof Leadership,
    value: string,
  ) => {
    setResumeData((prev) => ({
      ...prev,
      leadership: prev.leadership.map((lead) =>
        lead.id === id ? { ...lead, [field]: value } : lead,
      ),
    }));
  };

  const addEducation = () => {
    const newEducation: Education = {
      id: Date.now().toString(),
      universityName: "",
      degree: "",
      location: "",
      datesAttended: "",
      coursework: "",
    };
    setResumeData((prev) => ({
      ...prev,
      education: [...prev.education, newEducation],
    }));
  };

  const addExperience = () => {
    const newExperience: Experience = {
      id: Date.now().toString(),
      jobTitle: "",
      company: "",
      location: "",
      dates: "",
      achievements: "",
    };
    setResumeData((prev) => ({
      ...prev,
      experience: [...prev.experience, newExperience],
    }));
  };

  const addProject = () => {
    const newProject: Project = {
      id: Date.now().toString(),
      projectName: "",
      technologies: "",
      date: "",
      description: "",
    };
    setResumeData((prev) => ({
      ...prev,
      projects: [...prev.projects, newProject],
    }));
  };

  const addLeadership = () => {
    const newLeadership: Leadership = {
      id: Date.now().toString(),
      role: "",
      organization: "",
      dates: "",
      achievements: "",
    };
    setResumeData((prev) => ({
      ...prev,
      leadership: [...prev.leadership, newLeadership],
    }));
  };

  return (
    <div className="relative min-h-screen bg-gray-100">
      {/* Navigation */}
      <Navigation onBack={() => window.history.back()} />

      {/* Progress Bar */}
      <ProgressBar
        currentStep={2}
        totalSteps={2}
        label="Step 2 of 2 - Content Building"
      />

      {/* Main Content container */}
      <div className="mx-auto flex w-full max-w-[1240px] flex-1 flex-col items-start gap-6 px-4 py-6 lg:flex-row">
        {/* Left Panel - Form */}
        <div className="w-full overflow-auto bg-white lg:h-[780px] lg:w-[720px] lg:rounded-lg lg:shadow-sm">
          <Breadcrumb items={breadcrumbItems} />

          <div className="space-y-4 p-4 md:space-y-6 md:p-6">
            {/* Education Section */}
            <section>
              <h2 className="mb-3 text-sm font-bold text-gray-900 md:mb-4 md:text-base">
                Education
              </h2>
              <div className="space-y-3 rounded-md bg-gray-50 p-3 md:p-4">
                {resumeData.education.map((edu) => (
                  <SectionCard
                    key={edu.id}
                    title={edu.universityName || "New Education"}
                  >
                    <FormField
                      label="University Name"
                      name="universityName"
                      value={edu.universityName}
                      onChange={(_, value) =>
                        updateEducation(edu.id, "universityName", value)
                      }
                    />
                    <FormField
                      label="Degree"
                      name="degree"
                      value={edu.degree}
                      onChange={(_, value) =>
                        updateEducation(edu.id, "degree", value)
                      }
                    />
                    <FormField
                      label="Location"
                      name="location"
                      value={edu.location}
                      onChange={(_, value) =>
                        updateEducation(edu.id, "location", value)
                      }
                    />
                    <FormField
                      label="Dates Attended"
                      name="datesAttended"
                      value={edu.datesAttended}
                      onChange={(_, value) =>
                        updateEducation(edu.id, "datesAttended", value)
                      }
                    />
                    <FormField
                      label="Relevant Coursework (Optional)"
                      name="coursework"
                      value={edu.coursework || ""}
                      onChange={(_, value) =>
                        updateEducation(edu.id, "coursework", value)
                      }
                      type="textarea"
                    />
                  </SectionCard>
                ))}
              </div>
              <Button
                variant="primary"
                className="mt-3 w-full"
                onClick={addEducation}
              >
                + Add Education
              </Button>
            </section>

            {/* Experience Section */}
            <section>
              <h2 className="mb-3 text-sm font-bold text-gray-900 md:mb-4 md:text-base">
                Experience
              </h2>
              <div className="space-y-3 rounded-md bg-gray-50 p-3 md:p-4">
                {resumeData.experience.map((exp) => (
                  <SectionCard
                    key={exp.id}
                    title={`${exp.jobTitle || "New Position"}${exp.company ? `, ${exp.company}` : ""}`}
                  >
                    <FormField
                      label="Job Title"
                      name="jobTitle"
                      value={exp.jobTitle}
                      onChange={(_, value) =>
                        updateExperience(exp.id, "jobTitle", value)
                      }
                    />
                    <FormField
                      label="Company"
                      name="company"
                      value={exp.company}
                      onChange={(_, value) =>
                        updateExperience(exp.id, "company", value)
                      }
                    />
                    <FormField
                      label="Location"
                      name="location"
                      value={exp.location}
                      onChange={(_, value) =>
                        updateExperience(exp.id, "location", value)
                      }
                    />
                    <FormField
                      label="Dates"
                      name="dates"
                      value={exp.dates}
                      onChange={(_, value) =>
                        updateExperience(exp.id, "dates", value)
                      }
                    />
                    <FormField
                      label="Achievements (Bullet Points)"
                      name="achievements"
                      value={exp.achievements}
                      onChange={(_, value) =>
                        updateExperience(exp.id, "achievements", value)
                      }
                      type="textarea"
                    />
                    <Button variant="gradient" className="mt-2 w-full">
                      ✨ Smartfill (AI)
                    </Button>
                  </SectionCard>
                ))}
              </div>
              <Button
                variant="primary"
                className="mt-3 w-full"
                onClick={addExperience}
              >
                + Add Experience
              </Button>
            </section>

            {/* Projects Section */}
            <section>
              <h2 className="mb-3 text-sm font-bold text-gray-900 md:mb-4 md:text-base">
                Projects
              </h2>
              <div className="space-y-3 rounded-md bg-gray-50 p-3 md:p-4">
                {resumeData.projects.map((proj) => (
                  <SectionCard
                    key={proj.id}
                    title={proj.projectName || "New Project"}
                  >
                    <FormField
                      label="Project Name"
                      name="projectName"
                      value={proj.projectName}
                      onChange={(_, value) =>
                        updateProject(proj.id, "projectName", value)
                      }
                    />
                    <FormField
                      label="Technologies"
                      name="technologies"
                      value={proj.technologies}
                      onChange={(_, value) =>
                        updateProject(proj.id, "technologies", value)
                      }
                    />
                    <FormField
                      label="Date"
                      name="date"
                      value={proj.date}
                      onChange={(_, value) =>
                        updateProject(proj.id, "date", value)
                      }
                    />
                    <FormField
                      label="Description (Bullet Points)"
                      name="description"
                      value={proj.description}
                      onChange={(_, value) =>
                        updateProject(proj.id, "description", value)
                      }
                      type="textarea"
                    />
                  </SectionCard>
                ))}
              </div>
              <Button
                variant="primary"
                className="mt-3 w-full"
                onClick={addProject}
              >
                + Add Project
              </Button>
            </section>

            {/* Technical Skills Section */}
            <section>
              <h2 className="mb-3 text-sm font-bold text-gray-900 md:mb-4 md:text-base">
                Technical Skills
              </h2>
              <div className="space-y-3">
                <FormField
                  label="Languages"
                  name="languages"
                  value={resumeData.technicalSkills.languages}
                  onChange={(_, value) =>
                    setResumeData((prev) => ({
                      ...prev,
                      technicalSkills: {
                        ...prev.technicalSkills,
                        languages: value,
                      },
                    }))
                  }
                />
                <FormField
                  label="Developer Tools"
                  name="developerTools"
                  value={resumeData.technicalSkills.developerTools}
                  onChange={(_, value) =>
                    setResumeData((prev) => ({
                      ...prev,
                      technicalSkills: {
                        ...prev.technicalSkills,
                        developerTools: value,
                      },
                    }))
                  }
                />
                <FormField
                  label="Technologies/Frameworks"
                  name="technologiesFrameworks"
                  value={resumeData.technicalSkills.technologiesFrameworks}
                  onChange={(_, value) =>
                    setResumeData((prev) => ({
                      ...prev,
                      technicalSkills: {
                        ...prev.technicalSkills,
                        technologiesFrameworks: value,
                      },
                    }))
                  }
                />
              </div>
            </section>

            {/* Leadership Section */}
            <section>
              <h2 className="mb-3 text-sm font-bold text-gray-900 md:mb-4 md:text-base">
                Leadership / Extracurricular
              </h2>
              <div className="space-y-3 rounded-md bg-gray-50 p-3 md:p-4">
                {resumeData.leadership.map((lead) => (
                  <SectionCard
                    key={lead.id}
                    title={`${lead.role || "New Role"}${lead.organization ? `, ${lead.organization}` : ""}`}
                  >
                    <FormField
                      label="Role"
                      name="role"
                      value={lead.role}
                      onChange={(_, value) =>
                        updateLeadership(lead.id, "role", value)
                      }
                    />
                    <FormField
                      label="Organization"
                      name="organization"
                      value={lead.organization}
                      onChange={(_, value) =>
                        updateLeadership(lead.id, "organization", value)
                      }
                    />
                    <FormField
                      label="Dates"
                      name="dates"
                      value={lead.dates}
                      onChange={(_, value) =>
                        updateLeadership(lead.id, "dates", value)
                      }
                    />
                    <FormField
                      label="Achievements (Bullet Points)"
                      name="achievements"
                      value={lead.achievements}
                      onChange={(_, value) =>
                        updateLeadership(lead.id, "achievements", value)
                      }
                      type="textarea"
                    />
                  </SectionCard>
                ))}
              </div>
              <Button
                variant="primary"
                className="mt-3 w-full"
                onClick={addLeadership}
              >
                + Add Leadership/Extracurricular
              </Button>
            </section>

            {/* Auto-save indicator */}
            <div className="rounded bg-green-50 px-3 py-2 text-center">
              <p className="text-xs text-green-800">
                ✓ Auto-saved 2 minutes ago
              </p>
            </div>
          </div>
        </div>

        {/* Right Panel - Preview (hidden on mobile) */}
        <div className="hidden overflow-auto bg-white lg:block lg:h-[780px] lg:w-[520px] lg:rounded-lg lg:shadow-sm">
          <div className="sticky top-4 z-10 flex items-center justify-between border-b border-gray-200 bg-gray-50 px-5 py-4">
            <h3 className="text-sm font-bold text-gray-800">Live Preview</h3>
            <Button variant="outline" size="sm">
              ↓ Download PDF
            </Button>
          </div>

          <div className="flex-1 overflow-auto p-6">
            <div className="mx-auto max-w-2xl rounded border border-gray-200 bg-white p-10 shadow-sm">
              {/* Resume Preview Content */}
              <div className="border-b-2 border-indigo-500 pb-5">
                <h1 className="text-center text-2xl font-bold text-indigo-500">
                  FIRST LAST
                </h1>
                <p className="mt-1 text-center text-xs text-gray-600">
                  123 Street Name, Town, State 12345 | 123-456-7890 |
                  email@gmail.com |{" "}
                  <a href="#" className="text-blue-600 underline">
                    linkedin.com/in/username
                  </a>{" "}
                  |{" "}
                  <a href="#" className="text-blue-600 underline">
                    github.com/username
                  </a>
                </p>
              </div>

              {/* Rest of the preview would go here - simplified for brevity */}
              <div className="mt-6 space-y-6 text-sm">
                <div className="text-gray-500">
                  <p className="text-center italic">
                    Resume preview rendering...
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
