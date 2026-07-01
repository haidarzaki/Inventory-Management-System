import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ── Users ──
  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@assettrace.com' },
    update: {},
    create: { name: 'Admin', email: 'admin@assettrace.com', password: adminPassword, role: 'admin' },
  });

  const rina = await prisma.user.upsert({
    where: { email: 'rina@assettrace.com' },
    update: {},
    create: { name: 'Rina Kusuma', email: 'rina@assettrace.com', password: userPassword, role: 'user' },
  });

  const budi = await prisma.user.upsert({
    where: { email: 'budi@assettrace.com' },
    update: {},
    create: { name: 'Budi Santoso', email: 'budi@assettrace.com', password: userPassword, role: 'user' },
  });

  const siti = await prisma.user.upsert({
    where: { email: 'siti@assettrace.com' },
    update: {},
    create: { name: 'Siti Rahayu', email: 'siti@assettrace.com', password: userPassword, role: 'user' },
  });

  // ── Unique assets ──
  const uniqueAssetsData = [
    { name: 'MacBook Pro 14"', category: 'Laptop', serialNumber: 'C02XY1234ABC', status: 'available', location: 'IT Room A', site: 'Jakarta HQ' },
    { name: 'MacBook Pro 14"', category: 'Laptop', serialNumber: 'C02XY5678DEF', status: 'borrowed', location: 'IT Room A', site: 'Jakarta HQ', borrowedById: rina.id, borrowedAt: new Date('2026-06-10'), returnDue: new Date('2026-06-24') },
    { name: 'Dell XPS 15', category: 'Laptop', serialNumber: 'DXPS9087GHI', status: 'available', location: 'IT Room A', site: 'Jakarta HQ' },
    { name: 'Dell XPS 15', category: 'Laptop', serialNumber: 'DXPS9022JKL', status: 'borrowed', location: 'Server Room', site: 'Surabaya Office', borrowedById: budi.id, borrowedAt: new Date('2026-06-15'), returnDue: new Date('2026-06-29') },
    { name: 'Logitech MX Master 3', category: 'Peripheral', serialNumber: 'LGT-MX3-00123', status: 'available', location: 'Storage B', site: 'Jakarta HQ' },
    { name: 'Logitech MX Master 3', category: 'Peripheral', serialNumber: 'LGT-MX3-00456', status: 'available', location: 'Storage B', site: 'Surabaya Office' },
    { name: 'Dell 27" Monitor', category: 'Monitor', serialNumber: 'DLM27-9900MNO', status: 'borrowed', location: 'IT Room A', site: 'Bandung Branch', borrowedById: siti.id, borrowedAt: new Date('2026-06-18'), returnDue: new Date('2026-07-02') },
    { name: 'Dell 27" Monitor', category: 'Monitor', serialNumber: 'DLM27-9901PQR', status: 'available', location: 'IT Room A', site: 'Bandung Branch' },
    { name: 'iPad Pro 12.9"', category: 'Tablet', serialNumber: 'IPD12-A2378STU', status: 'available', location: 'Cabinet C', site: 'Bali Remote' },
    { name: 'Jabra Evolve2 85', category: 'Headset', serialNumber: 'JBR-E285-77001', status: 'retired', location: 'Storage B', site: 'Jakarta HQ' },
  ];

  for (const data of uniqueAssetsData) {
    await prisma.uniqueAsset.upsert({
      where: { serialNumber: data.serialNumber },
      update: {},
      create: data,
    });
  }

  // ── Consumable assets ──
  const consumableAssetsData = [
    { name: 'HP 63XL Black Ink', category: 'Ink Cartridge', unit: 'pcs', quantity: 8, minStock: 5, location: 'Supply Room', site: 'Jakarta HQ' },
    { name: 'HP 63XL Tri-color Ink', category: 'Ink Cartridge', unit: 'pcs', quantity: 3, minStock: 5, location: 'Supply Room', site: 'Jakarta HQ' },
    { name: 'USB-A to USB-C Cable 1m', category: 'Cable', unit: 'pcs', quantity: 24, minStock: 10, location: 'Storage B', site: 'Surabaya Office' },
    { name: 'HDMI Cable 2m', category: 'Cable', unit: 'pcs', quantity: 6, minStock: 8, location: 'Storage B', site: 'Surabaya Office' },
    { name: 'A4 Printing Paper', category: 'Stationery', unit: 'ream', quantity: 40, minStock: 15, location: 'Supply Room', site: 'Bandung Branch' },
    { name: 'AA Battery', category: 'Battery', unit: 'pcs', quantity: 52, minStock: 20, location: 'Supply Room', site: 'Jakarta HQ' },
    { name: 'AAA Battery', category: 'Battery', unit: 'pcs', quantity: 12, minStock: 20, location: 'Supply Room', site: 'Bali Remote' },
    { name: 'Ethernet RJ45 Cat6 5m', category: 'Cable', unit: 'pcs', quantity: 9, minStock: 5, location: 'Storage B', site: 'Bandung Branch' },
  ];

  const createdConsumables: Array<{ id: string; name: string; site: string; [key: string]: any }> = [];
  for (const data of consumableAssetsData) {
    const existing = await prisma.consumableAsset.findFirst({ where: { name: data.name, site: data.site } });
    if (existing) {
      createdConsumables.push(existing);
    } else {
      createdConsumables.push(await prisma.consumableAsset.create({ data }));
    }
  }

  // ── Sample activity logs ──
  const macbook2 = await prisma.uniqueAsset.findUnique({ where: { serialNumber: 'C02XY5678DEF' } });
  const dellXps = await prisma.uniqueAsset.findUnique({ where: { serialNumber: 'DXPS9022JKL' } });
  const dellMonitor = await prisma.uniqueAsset.findUnique({ where: { serialNumber: 'DLM27-9900MNO' } });
  const usbCable = createdConsumables.find((c) => c.name.includes('USB-A'));
  const paper = createdConsumables.find((c) => c.name.includes('Paper'));
  const battery = createdConsumables.find((c) => c.name === 'AA Battery');

  const logs = [
    macbook2 && { type: 'borrow', assetKind: 'unique', assetId: macbook2.id, assetName: macbook2.name, serial: macbook2.serialNumber, userId: rina.id, userName: rina.name, note: 'Project Alpha work-from-home', timestamp: new Date('2026-06-10T09:15:00') },
    dellXps && { type: 'borrow', assetKind: 'unique', assetId: dellXps.id, assetName: dellXps.name, serial: dellXps.serialNumber, userId: budi.id, userName: budi.name, timestamp: new Date('2026-06-15T11:30:00') },
    usbCable && { type: 'stock-out', assetKind: 'consumable', assetId: usbCable.id, assetName: usbCable.name, userId: siti.id, userName: siti.name, quantity: 2, timestamp: new Date('2026-06-17T14:00:00') },
    dellMonitor && { type: 'borrow', assetKind: 'unique', assetId: dellMonitor.id, assetName: dellMonitor.name, serial: dellMonitor.serialNumber, userId: siti.id, userName: siti.name, note: 'Dual-screen setup request', timestamp: new Date('2026-06-18T08:45:00') },
    paper && { type: 'stock-in', assetKind: 'consumable', assetId: paper.id, assetName: paper.name, userId: admin.id, userName: admin.name, quantity: 20, note: 'Monthly supply restock', timestamp: new Date('2026-06-19T10:00:00') },
    battery && { type: 'stock-out', assetKind: 'consumable', assetId: battery.id, assetName: battery.name, userId: budi.id, userName: 'Doni Prasetyo', quantity: 8, timestamp: new Date('2026-06-20T13:20:00') },
  ].filter(Boolean) as any[];

  for (const log of logs) {
    await prisma.logEntry.create({ data: log });
  }

  console.log('Seeding selesai.');
  console.log('Login admin   -> email: admin@assettrace.com | password: admin123');
  console.log('Login user    -> email: rina@assettrace.com  | password: user123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
