import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";

import FileUploader from "~/components/FileUploader";
import Navbar from "~/components/Navbar";
import { prepareInstructions } from "~/constants";
import { convertPdfToImage } from "~/lib/pdf2img";
import { usePuterStore } from "~/lib/puter";
import { generateUUID } from "~/lib/utils";

const Upload = () => {
  const { fs, ai, kv, auth, isLoading } = usePuterStore();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState("");

  const [file, setFile] = useState<File | null>(null);

  const handleFileSelect = (file: File | null) => {
    setFile(file);
  };
  const handleAnalyze = async ({
    companyName,
    jobTitle,
    jobDescription,
    file,
  }: {
    companyName: string;
    jobTitle: string;
    jobDescription: string;
    file: File;
  }) => {
    setIsProcessing(true);
    setStatusText("Uploading the file...");
    const uploadedFile = await fs.upload([file]);
    if (!uploadedFile) return setStatusText("Error, faild to upload file");

    setStatusText("Converting to image...");
    const imageFile = await convertPdfToImage(file);
    if (!imageFile.file) return setStatusText("Error : faild to convert pdf to image");

    setStatusText("uploading image...");
    const uploadedImage = await fs.upload([imageFile.file]);
    if (!uploadedImage) return setStatusText("Error : faild to upload the image..");
    setStatusText("preparing data...");

    const uniqueId = generateUUID();

    const data = {
      id: uniqueId,
      resumePath: uploadedFile.path,
      imagePath: uploadedImage.parent_id,
      companyName,
      jobTitle,
      jobDescription,
      feedback: "",
    };
    await kv.set(`resume:${uniqueId}`, JSON.stringify(data));
    setStatusText("analyzing");

    const feedback = await ai.feedback(uploadedFile.path, prepareInstructions({ jobTitle, jobDescription }));
    if (!feedback) return setStatusText("ERror: faild to analyze resume");

    const feedbackText = typeof feedback.message.content === "string" ? feedback.message.content : feedback.message.content[0].text;

    function cleanAIJson(text: string) {
      return text
        .replace(/```json/i, "")
        .replace(/```/g, "")
        .trim();
    }

    const cleaned = cleanAIJson(feedbackText);
    data.feedback = JSON.parse(cleaned);

    await kv.set(`resume:${uniqueId}`, JSON.stringify(data));
    setStatusText("analysis completed redirecting");
    console.log(data);
  };

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget.closest("form");

    if (!form) return;
    if (!file) return;
    const formData = new FormData(form);

    const companyName = formData.get("company-name") as string;
    const jobTitle = formData.get("job-title") as string;
    const jobDescription = formData.get("job-description") as string;

    handleAnalyze({ companyName, jobTitle, jobDescription, file });
  }

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />

      <section className="main-section ">
        <div className="page-heading py-16">
          <h1>Smart feedback for your dream job</h1>
          {isProcessing ? (
            <>
              <h2>{statusText}</h2>
              <img src="/images/resume-scan.gif" className="w-full" />
            </>
          ) : (
            <h2>Drop your resume for an ATS score and improvment tips</h2>
          )}

          {!isProcessing && (
            <form id="upload-form" onSubmit={handleSubmit} className="flex flex-col gap-4 mt-8">
              <div className="form-div">
                <label htmlFor="company-name">Company Name</label>
                <input type="text" name="company-name" id="company-name" placeholder="Company Name" />
              </div>
              <div className="form-div">
                <label htmlFor="job-title">job title</label>
                <input type="text" name="job-title" id="job-title" placeholder="job title" />
              </div>
              <div className="form-div">
                <label htmlFor="job-description">Job description</label>
                <textarea rows={4} name="job-description" id="job-description" placeholder="Job description" />
              </div>
              <div className="form-div">
                <label htmlFor="uploader">Uploader</label>
                <FileUploader onFileSelect={handleFileSelect} />
              </div>
              <button className="primary-button" type="submit">
                Analyze resume
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
};

export default Upload;
