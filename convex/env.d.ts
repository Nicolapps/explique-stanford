declare namespace Lucia {
  type Auth = import("./lucia").Auth;
  type DatabaseUserAttributes = {
    _id: import("./_generated/dataModel").Id<"users">;
    _creationTime: number;
    email: string | null;
    name: string | null;
    extraTime?: true;
    group: "A" | "B";
    researchConsent?: true;
    completedExercises: Array<import("./_generated/dataModel").Id<"exercises">>;
    identifier?: string;
  };
  type DatabaseSessionAttributes = {
    _id: import("./_generated/dataModel").Id<"sessions">;
    _creationTime: number;
  };
}
