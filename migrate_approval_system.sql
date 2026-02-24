-- For Staff Users
ALTER TABLE Users ADD ApprovedBy NVARCHAR(50) DEFAULT NULL;
ALTER TABLE Users ADD Remark NVARCHAR(MAX) DEFAULT NULL;

-- For Retailers Tracking
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('RetailerStatusTracking') AND name = 'ApprovedBy')
BEGIN
    ALTER TABLE RetailerStatusTracking ADD ApprovedBy NVARCHAR(50) DEFAULT NULL;
END

-- For Vendors Tracking
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('VendorStatusTracking') AND name = 'ApprovedBy')
BEGIN
    ALTER TABLE VendorStatusTracking ADD ApprovedBy NVARCHAR(50) DEFAULT NULL;
END
