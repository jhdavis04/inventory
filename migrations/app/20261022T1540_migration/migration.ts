#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/3a9e851d336a8651a6e684ac2f470cb6acfef185b08019133970fd48e69142da/contract';
import endContract from '../../snapshots/3a9e851d336a8651a6e684ac2f470cb6acfef185b08019133970fd48e69142da/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  col,
  fn,
  lit,
  primaryKey,
  sql,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: 'public' }),
      this.createTable({
        schema: 'public',
        table: 'Product',
        columns: [
          col('business_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('category_id', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('cost', 'numeric(10,2)', {
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 10, scale: 2 } },
          }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('price', 'numeric(10,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 10, scale: 2 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'batch_supply_usage',
        columns: [
          col('batch_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('qty_used', 'numeric(10,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 10, scale: 2 } },
          }),
          col('supply_lot_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['batch_id', 'supply_lot_id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'batches',
        columns: [
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('made_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('product_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('qty_made', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'bill_of_materials',
        columns: [
          col('product_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('qty_required', 'numeric(10,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 10, scale: 2 } },
          }),
          col('supply_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('unit', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['product_id', 'supply_id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'businesses',
        columns: [
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'categories',
        columns: [
          col('business_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'external_order_items',
        columns: [
          col('external_line_item_id', 'text', {
            notNull: true,
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('order_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('product_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('quantity', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('unit_price', 'numeric(10,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 10, scale: 2 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'external_orders',
        columns: [
          col('business_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('external_order_id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('last_synced_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('ordered_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('sales_channel_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'product_mappings',
        columns: [
          col('[product_id]', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('external_sku_or_product_id', 'text', {
            notNull: true,
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('sales_channel_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'sales_channel',
        columns: [
          col('access_token', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('business_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('display_name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('external_shop_id', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('last_synced_at', 'timestamptz', {
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('refresh_token', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('type', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'supplies',
        columns: [
          col('business_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'supply_lots',
        columns: [
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('purchased_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('qty_purchased', 'numeric(10,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 10, scale: 2 } },
          }),
          col('qty_remaining', 'numeric(10,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 10, scale: 2 } },
          }),
          col('supply_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('total_cost', 'numeric(10,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 10, scale: 2 } },
          }),
          col('unit', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'users',
        columns: [
          col('business_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('name', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('role', 'text', {
            notNull: true,
            default: lit('owner'),
            codecRef: { codecId: 'pg/text@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'categories',
        constraint: 'categories_business_id_name_key',
        columns: ['business_id', 'name'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'external_order_items',
        constraint: 'external_order_items_order_id_external_line_item_id_key',
        columns: ['order_id', 'external_line_item_id'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'external_orders',
        constraint: 'external_orders_sales_channel_id_external_order_id_key',
        columns: ['sales_channel_id', 'external_order_id'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'product_mappings',
        constraint: 'product_mappings_sales_channel_id_external_sku_or_product_id_ke',
        columns: ['sales_channel_id', 'external_sku_or_product_id'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'sales_channel',
        constraint: 'sales_channel_business_id_type_external_shop_id_key',
        columns: ['business_id', 'type', 'external_shop_id'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'users',
        constraint: 'users_email_key',
        columns: ['email'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Product',
        index: 'Product_business_id_idx_23036de8',
        columns: ['business_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Product',
        index: 'Product_category_id_idx_da7213d4',
        columns: ['category_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'batch_supply_usage',
        index: 'batch_supply_usage_batch_id_idx_49ba28fa',
        columns: ['batch_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'batch_supply_usage',
        index: 'batch_supply_usage_supply_lot_id_idx_7ea4c78a',
        columns: ['supply_lot_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'batches',
        index: 'batches_product_id_idx_22a2b7d2',
        columns: ['product_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'bill_of_materials',
        index: 'bill_of_materials_product_id_idx_22a2b7d2',
        columns: ['product_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'bill_of_materials',
        index: 'bill_of_materials_supply_id_idx_6ccef6d6',
        columns: ['supply_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'categories',
        index: 'categories_business_id_idx_23036de8',
        columns: ['business_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'external_order_items',
        index: 'external_order_items_order_id_idx_39ad19ad',
        columns: ['order_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'external_order_items',
        index: 'external_order_items_product_id_idx_22a2b7d2',
        columns: ['product_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'external_orders',
        index: 'external_orders_business_id_idx_23036de8',
        columns: ['business_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'external_orders',
        index: 'external_orders_sales_channel_id_idx_23b3e2d5',
        columns: ['sales_channel_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'product_mappings',
        index: 'product_mappings_[product_id]_idx_3a1ffd05',
        columns: ['[product_id]'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'product_mappings',
        index: 'product_mappings_sales_channel_id_idx_23b3e2d5',
        columns: ['sales_channel_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'sales_channel',
        index: 'sales_channel_business_id_idx_23036de8',
        columns: ['business_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'supplies',
        index: 'supplies_business_id_idx_23036de8',
        columns: ['business_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'supply_lots',
        index: 'supply_lots_supply_id_idx_6ccef6d6',
        columns: ['supply_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'users',
        index: 'users_business_id_idx_23036de8',
        columns: ['business_id'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Product',
        foreignKey: {
          name: 'Product_business_id_fkey',
          columns: ['business_id'],
          references: { schema: 'public', table: 'businesses', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Product',
        foreignKey: {
          name: 'Product_category_id_fkey',
          columns: ['category_id'],
          references: { schema: 'public', table: 'categories', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'batch_supply_usage',
        foreignKey: {
          name: 'batch_supply_usage_batch_id_fkey',
          columns: ['batch_id'],
          references: { schema: 'public', table: 'batches', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'batch_supply_usage',
        foreignKey: {
          name: 'batch_supply_usage_supply_lot_id_fkey',
          columns: ['supply_lot_id'],
          references: { schema: 'public', table: 'supply_lots', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'batches',
        foreignKey: {
          name: 'batches_product_id_fkey',
          columns: ['product_id'],
          references: { schema: 'public', table: 'Product', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'bill_of_materials',
        foreignKey: {
          name: 'bill_of_materials_product_id_fkey',
          columns: ['product_id'],
          references: { schema: 'public', table: 'Product', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'bill_of_materials',
        foreignKey: {
          name: 'bill_of_materials_supply_id_fkey',
          columns: ['supply_id'],
          references: { schema: 'public', table: 'supplies', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'categories',
        foreignKey: {
          name: 'categories_business_id_fkey',
          columns: ['business_id'],
          references: { schema: 'public', table: 'businesses', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'external_order_items',
        foreignKey: {
          name: 'external_order_items_order_id_fkey',
          columns: ['order_id'],
          references: { schema: 'public', table: 'external_orders', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'external_order_items',
        foreignKey: {
          name: 'external_order_items_product_id_fkey',
          columns: ['product_id'],
          references: { schema: 'public', table: 'Product', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'external_orders',
        foreignKey: {
          name: 'external_orders_business_id_fkey',
          columns: ['business_id'],
          references: { schema: 'public', table: 'businesses', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'external_orders',
        foreignKey: {
          name: 'external_orders_sales_channel_id_fkey',
          columns: ['sales_channel_id'],
          references: { schema: 'public', table: 'sales_channel', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'product_mappings',
        foreignKey: {
          name: 'product_mappings_sales_channel_id_fkey',
          columns: ['sales_channel_id'],
          references: { schema: 'public', table: 'sales_channel', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'product_mappings',
        foreignKey: {
          name: 'product_mappings_[product_id]_fkey',
          columns: ['[product_id]'],
          references: { schema: 'public', table: 'Product', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'sales_channel',
        foreignKey: {
          name: 'sales_channel_business_id_fkey',
          columns: ['business_id'],
          references: { schema: 'public', table: 'businesses', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'supplies',
        foreignKey: {
          name: 'supplies_business_id_fkey',
          columns: ['business_id'],
          references: { schema: 'public', table: 'businesses', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'supply_lots',
        foreignKey: {
          name: 'supply_lots_supply_id_fkey',
          columns: ['supply_id'],
          references: { schema: 'public', table: 'supplies', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'users',
        foreignKey: {
          name: 'users_business_id_fkey',
          columns: ['business_id'],
          references: { schema: 'public', table: 'businesses', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
