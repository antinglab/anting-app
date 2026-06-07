import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { CrewMemberForm, UserType } from "@/types";

/**
 * Saves a new crew member to the 'crew_members' Firestore collection.
 */
export async function addCrewMember(
  data: CrewMemberForm,
  userType: UserType,
  resultType: string
) {
  try {
    const crewRef = collection(db, "crew_members");
    const docRef = await addDoc(crewRef, {
      ...data,
      userType,
      resultType,
      source: "mvp_beta",
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Firestore crew member save failed:", error);
    throw error;
  }
}
