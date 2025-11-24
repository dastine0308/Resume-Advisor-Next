import { Suspense } from "react";
import { ResumeContent } from "@/components/resume-content";

interface ResumePageProps {
  searchParams: Promise<{ resumeId?: string }>;
}

export default async function ResumePage({ searchParams }: ResumePageProps) {
  const params = await searchParams;
  const resumeId = params?.resumeId ?? null;
  let resumeData = null;

  if (resumeId) {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/resumes/${resumeId}`);

      // TEST: Mock data
      resumeData = {
        personalInfo: {
          name: "First Last",
          address: "123 Street Name, Town, State 12345",
          phone: "123-456-7890",
          email: "email@gmail.com",
          linkedin: "linkedin.com/in/username",
          github: "github.com/username",
        },
        education: [
          {
            id: "1",
            universityName: "State University",
            degree: "Bachelor of Science in Computer Science",
            location: "City, State",
            datesAttended: "Sep. 2017 – May 2021",
            coursework:
              "Data Structures, Software Methodology, Algorithms Analysis, Database Management, Artificial Intelligence, Internet Technology, Systems Programming, Computer Architecture",
            order: 0,
          },
        ],
        experience: [
          {
            id: "1",
            jobTitle: "Software Engineer Intern",
            company: "Electronics Company",
            location: "City, State",
            dates: "May 2020 – August 2020",
            description:
              "• Developed a service to automatically perform a set of unit tests daily on a product in development in order to decrease time needed for team members to identify and fix bugs/issues.\n• Incorporated scripts using Python and PowerShell to aggregate XML test results into an organized format and to load the latest build code onto the hardware, so that daily testing can be performed.\n• Utilized Jenkins to provide a continuous integration service in order to automate the entire process of loading the latest build code and test files, running the tests, and generating a report of the results once per day.\n• Explored ways to visualize and send a daily report of test results to team members using HTML, Javascript, and CSS.",
            order: 0,
          },
          {
            id: "2",
            jobTitle: "Front End Developer Intern",
            company: "Startup, Inc",
            location: "City, State",
            dates: "May 2019 – August 2019",
            description:
              "• Assisted in development of the front end of a mobile application for iOS/Android using Dart and the Flutter framework.\n• Worked with Google Firebase to manage user inputted data across multiple platforms including web and mobile apps.\n• Collaborated with team members using version control systems such as Git to organize modifications and assign tasks.\n• Utilized Android Studio as a development environment in order to visualize the application in both iOS and Android.",
            order: 1,
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
            order: 0,
          },
          {
            id: "2",
            projectName: "Ticket Price Calculator App",
            technologies: "Java, Android Studio",
            date: "November 2020",
            description:
              "• Created an Android application using Java and Android Studio to calculate ticket prices for trips to museums in NYC.\n• Processed user inputted information in the back-end of the app to return a subtotal price based on the tickets selected.\n• Utilized the layout editor to create a UI for the application in order to allow different scenes to interact with each other.",
            order: 1,
          },
          {
            id: "3",
            projectName: "Transaction Management GUI",
            technologies: "Java, Eclipse, JavaFX",
            date: "October 2020",
            description:
              "• Designed a sample banking transaction system using Java to simulate the common functions of using a bank account.\n• Used JavaFX to create a GUI that supports actions such as creating an account, deposit, withdraw, list all accounts, etc.\n• Implemented object-oriented programming practices such as inheritance to create different acount types and databases.",
            order: 2,
          },
        ],
        leadership: [
          {
            id: "1",
            role: "President",
            organization: "Fraternity",
            dates: "Spring 2020 – Present",
            description:
              "• Achieved a 4-star fraternity ranking by the Office of Fraternity and Sorority Affairs (highest possible ranking).\n• Managed executive board of 5 members and ran weekly meetings to oversee progress in essential parts of the chapter.\n• Led chapter of 30+ members to work towards goals that improve and promote community service, academics, and unity.",
            order: 0,
          },
        ],
        technicalSkills: {
          languages: "Python, Java, C, HTML/CSS, JavaScript, SQL",
          developerTools:
            "VS Code, Eclipse, Google Cloud Platform, Android Studio",
          technologiesFrameworks: "Linux, Jenkins, GitHub, JUnit, WordPress",
        },
      };
    } catch (error) {
      console.error("Failed to fetch resume data:", error);
    }
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResumeContent resumeId={resumeId} resumeData={resumeData} />
    </Suspense>
  );
}
