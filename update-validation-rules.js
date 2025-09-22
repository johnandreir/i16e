// Update validation schemas to use teamID, squadID, created_at, updated_at convention

// Update squads collection validation
db.runCommand({
  collMod: "squads", 
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "teamID", "created_at"],
      properties: {
        name: {
          bsonType: "string",
          description: "Squad name must be a string and is required"
        },
        teamID: {
          bsonType: "string",
          description: "Team ID must be a string and is required"
        },
        description: {
          bsonType: "string",
          description: "Squad description must be a string"
        },
        created_at: {
          bsonType: "date",
          description: "Creation date must be a date and is required"
        },
        updated_at: {
          bsonType: "date",
          description: "Update date must be a date"
        }
      }
    }
  },
  validationLevel: "strict"
});

// Update DPEs collection validation
db.runCommand({
  collMod: "dpes", 
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "squadID", "created_at"],
      properties: {
        name: {
          bsonType: "string",
          description: "DPE name must be a string and is required"
        },
        squadID: {
          bsonType: "string", 
          description: "Squad ID must be a string and is required"
        },
        email: {
          bsonType: "string",
          description: "DPE email must be a string"
        },
        description: {
          bsonType: "string",
          description: "DPE description must be a string"
        },
        created_at: {
          bsonType: "date",
          description: "Creation date must be a date and is required"
        },
        updated_at: {
          bsonType: "date",
          description: "Update date must be a date"
        }
      }
    }
  },
  validationLevel: "strict"
});

print("Validation schemas updated successfully!");