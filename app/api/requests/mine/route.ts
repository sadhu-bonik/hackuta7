import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/auth/server";
import { getUserRequests } from "@/lib/firebase/firestore";

export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuthToken(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requests = await getUserRequests(user.uid);

    return NextResponse.json({ requests }, { status: 200 });
  } catch (error) {
    console.error("Error fetching user requests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
