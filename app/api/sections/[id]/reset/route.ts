import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { resetSectionProgress } from "@/backend/db/queries";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const sectionId = parseInt(id, 10);

    if (isNaN(sectionId)) {
      return NextResponse.json(
        { error: "Invalid section ID" },
        { status: 400 },
      );
    }

    await resetSectionProgress(userId, sectionId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error resetting section progress:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
