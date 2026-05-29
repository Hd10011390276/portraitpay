import dynamicImport from "next/dynamic";
export const dynamic = "force-dynamic";

const UploadForm = dynamicImport(() => import("./UploadForm"), { ssr: false });

export default function UploadPortraitPage() {
  return <UploadForm />;
}