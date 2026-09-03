import { Suspense } from "react";

import AskPageContent from "./AskPageContent";

export default function AskPage() {
  return (
    <Suspense fallback={null}>
      <AskPageContent />
    </Suspense>
  );
}
