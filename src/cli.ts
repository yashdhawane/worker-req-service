import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { RequestService } from "./requestService.js";

function printRequest(request: Awaited<ReturnType<RequestService["getById"]>>): void {
  console.log(`ID: ${request.id}`);
  console.log(`Title: ${request.title}`);
  console.log(`Description: ${request.description}`);
  console.log(`Priority: ${request.priority}`);
  console.log(`Status: ${request.status}`);
  console.log(`Created: ${request.createdAt}`);
  console.log(`Updated: ${request.updatedAt}`);
}

async function main(): Promise<void> {
  const readline = createInterface({ input: stdin, output: stdout });
  const service = new RequestService();

  try {
    while (true) {
      console.log("\n1. Create request");
      console.log("2. List requests");
      console.log("3. Filter requests");
      console.log("4. View request by ID");
      console.log("5. Change request status");
      console.log("6. View request history");
      console.log("7. Exit");

      const choice = (await readline.question("Choose an option: ")).trim();
      try {
        switch (choice) {
          case "1": {
            const title = await readline.question("Title: ");
            const description = await readline.question("Description (optional): ");
            const priority = await readline.question("Priority (low/medium/high): ");
            const request = await service.create({ title, description, priority });
            console.log(`Created request ${request.id}`);
            break;
          }
          case "2": {
            const requests = await service.list();
            if (requests.length === 0) {
              console.log("No requests found.");
            } else {
              for (const request of requests) {
                console.log(
                  `${request.id} | ${request.title} | ${request.priority} | ${request.status} | ${request.createdAt}`,
                );
              }
            }
            break;
          }
          case "3": {
            const statusInput = (await readline.question(
              "Status filter (leave blank for none; new/in_progress/done): ",
            )).trim();
            const priorityInput = (await readline.question(
              "Priority filter (leave blank for none; low/medium/high): ",
            )).trim();
            const input = {
              ...(statusInput ? { status: statusInput } : {}),
              ...(priorityInput ? { priority: priorityInput } : {}),
            };
            const requests = await service.filter(input);
            if (requests.length === 0) {
              console.log("No requests match the filters.");
            } else {
              for (const request of requests) {
                console.log(
                  `${request.id} | ${request.title} | ${request.priority} | ${request.status}`,
                );
              }
            }
            break;
          }
          case "4": {
            const id = (await readline.question("Request ID: ")).trim();
            printRequest(await service.getById(id));
            break;
          }
          case "5": {
            const id = (await readline.question("Request ID: ")).trim();
            const request = await service.getById(id);
            console.log(`Current status: ${request.status}`);
            const status = (await readline.question(
              "New status (new/in_progress/done): ",
            )).trim();
            const updated = await service.changeStatus(request.id, status);
            console.log(`Updated request ${updated.id} to ${updated.status}`);
            break;
          }
          case "6": {
            const id = (await readline.question("Request ID: ")).trim();
            const history = await service.getHistory(id);
            if (history.length === 0) {
              console.log("No history found.");
            } else {
              for (const event of history) {
                console.log(
                  `${event.id} | ${event.timestamp} | ${event.event} | ${event.previousStatus ?? "-"} -> ${event.newStatus}`,
                );
              }
            }
            break;
          }
          case "7":
            return;
          default:
            console.log("Invalid menu choice.");
        }
      } catch (error) {
        console.log(`Error: ${(error as Error).message}`);
      }
    }
  } finally {
    readline.close();
  }
}

void main();
