import { db } from '../prisma/db';
import { round2 } from './helperFunctions';

const Product = db.orm.public.Product;
const Supply = db.orm.public.Supply;
const SupplyLot = db.orm.public.SupplyLot;
const BillOfMaterial = db.orm.public.BillOfMaterial;

const round4 = (n: number) => Math.round(n * 10000) / 10000;

type Lot = { id: number; qtyPurchased: unknown; qtyRemaining: unknown; totalCost: unknown; unit: string };
type RecipeItem = { supplyId: number; qtyRequired: unknown; unit: string };

export type CostLine = {

}

// how much does one unit of a supply cost
// takes most recent purchase total and devides by quantity
function latestUnitCost (lots: Lot[]): number | null {
    return null;
}

// how much does product cost to make: will be used by one product version and all products
export function costProduct() {

}

// calculates one specific product cost
export async function calculateProductCost(businessId: number, productId: number) {
    const product = await Product.where({ id: productId, businessId }).first();
    if (!product) return null;


    // ACTUAL MATH HERE, return and products are here strictly so vscode will stop giving errors for my un implemented stuff

    return {
        product,
        cost: null as number | null,
        knownCost: 0,
        source: 'manual' as 'manual' | 'recipe',
        lines: [] as CostLine[],
        missingSupplies: [] as number[],
    };
};

// cost of every product, basically "how much does it cost to make all my items"
export async function productCosts(businessId: number) {

}

// what one unit of every material costs, maybe add whats in stock
export async function materialCosts(businessId: number) {

}
