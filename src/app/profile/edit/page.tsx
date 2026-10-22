import type { Metadata } from "next";
import { EditProfile } from "@/components/profile/EditProfile";

export const metadata: Metadata = { title: "Edit profile" };

export default function EditProfilePage() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-4xl text-leaf-deep">Edit profile</h1>
        <p className="mt-1 max-w-xl text-muted">
          Touch up your picture or start fresh with the trash can. Your handle stays the same.
        </p>
      </div>
      <EditProfile />
    </div>
  );
}
