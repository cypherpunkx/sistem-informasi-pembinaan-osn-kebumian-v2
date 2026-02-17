import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import ProfileForm from "@/components/dashboard/profile/ProfileForm";
import { UserCircle } from "lucide-react";

export default async function ProfilePage() {
    const session = await auth();

    if (!session?.user?.email) {
        redirect("/login");
    }

    const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, session.user.email))
        .limit(1);

    if (!user) {
        // Should not happen if session is valid but good to handle
        return <div>User not found</div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header / Cover */}
            <div className="bg-accent-earthy rounded-xl p-6 text-white flex items-center gap-6 shadow-md">
                <div className="bg-white/20 p-4 rounded-full">
                    <UserCircle className="w-16 h-16 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">{user.name}</h1>
                    <p className="opacity-90">{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
                    <p className="text-sm opacity-75 mt-1">{user.email}</p>
                </div>
            </div>

            <ProfileForm user={user} />
        </div>
    );
}
