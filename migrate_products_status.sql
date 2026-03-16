-- Migration: Add Status tracking columns to onboarding.Products
-- Run this on the production database if not already applied
-- Date: 2026-03-16

IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'onboarding' AND TABLE_NAME = 'Products' AND COLUMN_NAME = 'Status'
)
BEGIN
    ALTER TABLE [onboarding].Products ADD Status VARCHAR(50) DEFAULT 'Pending' NOT NULL;
    PRINT 'Added Status column to onboarding.Products';
END

IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'onboarding' AND TABLE_NAME = 'Products' AND COLUMN_NAME = 'StatusRemark'
)
BEGIN
    ALTER TABLE [onboarding].Products ADD StatusRemark VARCHAR(500) NULL;
    PRINT 'Added StatusRemark column to onboarding.Products';
END

IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'onboarding' AND TABLE_NAME = 'Products' AND COLUMN_NAME = 'UpdatedAt'
)
BEGIN
    ALTER TABLE [onboarding].Products ADD UpdatedAt DATETIME NULL DEFAULT GETDATE();
    PRINT 'Added UpdatedAt column to onboarding.Products';
END
