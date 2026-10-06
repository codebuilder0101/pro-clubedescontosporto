import { placeholderRoute } from "@/components/placeholder-page";

// Placeholder until this route is built; see placeholder-page.tsx.
const route = placeholderRoute("cookies");
export const generateMetadata = route.generateMetadata;
export default route.Page;
