import { db } from "@/db";
import { members } from "@/db/schema";

export async function seedMembers() {
  console.log("⏳ Memulai seeding data members...");

  try {
    const rawData = [
      {
        name: "Budi",
        phone: "+628123456701",
        memberType: "STUDENT" as const,
        status: "ACTIVE" as const,
      },
      {
        name: "Siti",
        phone: "+628123456702",
        memberType: "STUDENT" as const,
        status: "ACTIVE" as const,
      },
      {
        name: "Joko",
        phone: "+628123456703",
        memberType: "LECTURER" as const,
        status: "ACTIVE" as const,
      },
      {
        name: "Dewi",
        phone: "+628123456704",
        memberType: "STAFF" as const,
        status: "ACTIVE" as const,
      },
      {
        name: "Agus",
        phone: "+628123456705",
        memberType: "STUDENT" as const,
        status: "ACTIVE" as const,
      },
      {
        name: "Ani",
        phone: "+628123456706",
        memberType: "STUDENT" as const,
        status: "ACTIVE" as const,
      },
      {
        name: "Eko",
        phone: "+628123456707",
        memberType: "LECTURER" as const,
        status: "INACTIVE" as const,
      },
      {
        name: "Rina",
        phone: "+628123456708",
        memberType: "STAFF" as const,
        status: "ACTIVE" as const,
      },
      {
        name: "Doni",
        phone: "+628123456709",
        memberType: "STUDENT" as const,
        status: "ACTIVE" as const,
      },
      {
        name: "Lestari",
        phone: "+628123456710",
        memberType: "STUDENT" as const,
        status: "ACTIVE" as const,
      },
      {
        name: "Hadi",
        phone: "+628123456711",
        memberType: "LECTURER" as const,
        status: "ACTIVE" as const,
      },
      {
        name: "Maya",
        phone: "+628123456712",
        memberType: "STAFF" as const,
        status: "ACTIVE" as const,
      },
      {
        name: "Riko",
        phone: "+628123456713",
        memberType: "STUDENT" as const,
        status: "ACTIVE" as const,
      },
      {
        name: "Tuti",
        phone: "+628123456714",
        memberType: "STUDENT" as const,
        status: "INACTIVE" as const,
      },
      {
        name: "Bayu",
        phone: "+628123456715",
        memberType: "LECTURER" as const,
        status: "ACTIVE" as const,
      },
      {
        name: "Wati",
        phone: "+628123456716",
        memberType: "STAFF" as const,
        status: "ACTIVE" as const,
      },
      {
        name: "Iwan",
        phone: "+628123456717",
        memberType: "STUDENT" as const,
        status: "ACTIVE" as const,
      },
      {
        name: "Siska",
        phone: "+628123456718",
        memberType: "STUDENT" as const,
        status: "ACTIVE" as const,
      },
      {
        name: "Rudi",
        phone: "+628123456719",
        memberType: "LECTURER" as const,
        status: "ACTIVE" as const,
      },
      {
        name: "Nina",
        phone: "+628123456720",
        memberType: "STAFF" as const,
        status: "ACTIVE" as const,
      },
    ];

    const formattedMembers = rawData.map((item) => {
      const cleanName = item.name.replace(/\s+/g, "").toUpperCase();
      const phone4Digit = item.phone.slice(-4);
      const memberCode = `${cleanName}#${phone4Digit}`;

      return {
        memberCode,
        name: item.name,
        phone: item.phone,
        memberType: item.memberType,
        registeredAt: new Date().toISOString().split("T")[0],
        status: item.status,
      };
    });

    console.log("Menyimpan data members ke database...");
    await db.insert(members).values(formattedMembers);
    console.log("✅ Berhasil menambahkan 20 data member!");
  } catch (error) {
    console.error("❌ Gagal melakukan seeding members:", error);
    throw error;
  }
}
