/**
 * MOCK data only — seed for services/clientService.js.
 */
export const INDUSTRIES = ["Solar", "Manufacturing", "Retail", "Healthcare", "Technology", "Other"];
export const CLIENT_STATUSES = ["Lead", "Active", "Inactive"];

export const MOCK_CLIENTS = [
  {
    id: "c-001",
    companyName: "Patel Solar Solutions",
    contactName: "Dahyabhai Patel",
    email: "dahyabhai@patelsolar.in",
    phone: "9574454966",
    city: "Valsad",
    industry: "Solar",
    status: "Active",
    createdDate: "2025-11-02",
  },
  {
    id: "c-002",
    companyName: "Mistry Manufacturing",
    contactName: "Dhanabhai Mistry",
    email: "dhanabhai@mistrymfg.in",
    phone: "9876543210",
    city: "Vapi",
    industry: "Manufacturing",
    status: "Active",
    createdDate: "2025-12-10",
  },
  {
    id: "c-003",
    companyName: "Mehta Retail Group",
    contactName: "Ashok Mehta",
    email: "ashok@mehtaretail.in",
    phone: "9876123456",
    city: "Surat",
    industry: "Retail",
    status: "Lead",
    createdDate: "2026-01-05",
  },
];