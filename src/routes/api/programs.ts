import express, { type Request, type Response, type Router } from "express";
import { env } from "../../env";
import { z } from "zod";

const router: Router = express.Router();

// Define schemas
const schemas = {
    programId: z.string().regex(/^[0-9]{10}$/),
};

router.get("/:programId", async (req: Request, res: Response) => {
    const { programId } = req.params;

    // Validate all inputs
    const validationSchema = z.object({
        programId: schemas.programId,
    });

    const validationResult = validationSchema.safeParse({ programId });

    if (!validationResult.success) {
        res.status(400).json({
            endpoint: "/api/v1/programs/:programId",
            hasError: 1,
            result: {
                error: 400,
                message: "Invalid Program ID",
            },
        });
        return;
    }

    // Access validated data
    const { programId: validatedProgramId } = validationResult.data;

    try {
        const response = await fetch(
            `${env.VINO_JP_TV_PROGRAM_DETAILS_BASE_URL}/${validatedProgramId}/web`
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json() as any;

        // Transform any /Date(timestamp)/ format to string timestamp
        const dateReplacer = (_key: string, value: unknown): unknown => {
            if (typeof value === "string" && value.match(/^\/Date\(\d+\)\/$/)) {
                return value.replace(/^\/Date\((\d+)\)\/$/, "$1");
            }
            return value;
        };

        res.status(200).json({
            endpoint: "/api/v1/programs/:programId",
            hasError: 0,
            result: JSON.parse(JSON.stringify(data.data.item, dateReplacer)),
            programId: validatedProgramId,
        });
        return;
    } catch (e: unknown) {
        console.error(`Error in /api/v1/programs/${validatedProgramId}: ${e}`);

        res.status(500).json({
            endpoint: "/api/v1/programs/:programId",
            hasError: 1,
            result: {
                error: 500,
                message: "Internal Server Error",
            },
        });
        return;
    }
});

export { router as programs };
