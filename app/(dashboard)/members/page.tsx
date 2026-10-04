import { getMembers } from "@/actions/members";
import { MemberClient } from "./member-client";

export const metadata = {
  title: "Member Management | Perpustakaan Arunika",
};

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;

  const query = params?.q || "";
  const page = Number(params?.page) || 1;

  const { data, total } = await getMembers(query, page);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Direktori Member</h1>
        <p className="text-sm text-slate-500">
          Kelola data pendaftaran dan status anggota perpustakaan.
        </p>
      </div>

      <MemberClient data={data} total={total} currentPage={page} />
    </div>
  );
}
