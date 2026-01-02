import Navbar from "~/components/Navbar";
import type { Route } from "./+types/home";
import { resumes } from "~/constants";
import ResumeCard from "~/components/ResumeCard";
import { usePuterStore } from "~/lib/puter";
import { useLocation, useNavigate } from "react-router";
import { useEffect } from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Resumeind Abdo cv" },
    { name: "description", content: "welcome to abdo resume maker!" },
  ];
}

export default function Home() {
  const { isLoading, auth } = usePuterStore();
  const location = useLocation();

  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.isAuthenticated) navigate("/auth?next=/");
  }, [auth.isAuthenticated]);

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />

      <section className="main-section ">
        <div className="page-heading py-16">
          <h1>Track your applications & resume rating</h1>
          <h2>review your submissions and check ai-powerd feedback</h2>
        </div>
      </section>
      {resumes.length > 0 && (
        <div className="resumes-section">
          {resumes.map((ele) => (
            <ResumeCard key={ele.id} resume={ele} />
          ))}
        </div>
      )}
    </main>
  );
}
