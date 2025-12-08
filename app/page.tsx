import { redirect } from "next/navigation";

export default function Home() {
  // Always send visitors on the root URL to the login page
  redirect("/login");
}
