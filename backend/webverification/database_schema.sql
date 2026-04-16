CREATE TABLE Users (
    UserId INT IDENTITY(1,1) PRIMARY KEY,
    FullName VARCHAR(100),
    Email VARCHAR(100) UNIQUE,
    Phone VARCHAR(20),
    AadharNumber VARCHAR(12) UNIQUE,
    PANNumber VARCHAR(10) UNIQUE,
    PasswordHash VARCHAR(255) NOT NULL,
    IsPhoneVerified BIT DEFAULT 0,
    Status VARCHAR(20) DEFAULT 'Pending',
    ProfilePhoto VARBINARY(MAX),
    ResetToken VARCHAR(255),
    ResetTokenExpiry DATETIME,
    CreatedAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE RegistrationType (
    RegistrationId INT IDENTITY PRIMARY KEY,
    UserId INT NOT NULL REFERENCES Users(UserId),
    BusinessType VARCHAR(50) 
        CHECK (BusinessType IN ('Retailer','Vendor')),
    Status VARCHAR(50) DEFAULT 'Approved',
    CreatedAt DATETIME DEFAULT GETDATE()
);

/* Retailer Tables */
CREATE TABLE Retailers (
    RetailerId INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL REFERENCES Users(UserId),
    ShopName VARCHAR(200) NOT NULL,
    RetailerName VARCHAR(150) NOT NULL,
    EmailAddress VARCHAR(150) NOT NULL,
    WhatsAppNumber VARCHAR(20) NOT NULL,
    Pincode VARCHAR(10) NOT NULL,
    ShopAddress VARCHAR(MAX) NOT NULL,
    LiveLocationLatitude DECIMAL(10,7) NOT NULL,
    LiveLocationLongitude DECIMAL(10,7) NOT NULL,
    AadharCardNumber VARCHAR(12) NOT NULL UNIQUE,
    PANCardNumber VARCHAR(10) NOT NULL UNIQUE,
    GSTNumber VARCHAR(20) NULL,
    DeclarationConfirmed BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE RetailerShopPhotos (
    PhotoId INT IDENTITY(1,1) PRIMARY KEY,
    RetailerId INT NOT NULL REFERENCES Retailers(RetailerId),
    PhotoType VARCHAR(50) NOT NULL,  
    ShopPhoto VARBINARY(MAX) NOT NULL, 
    UploadedAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE RetailerDocuments (
    DocumentId INT IDENTITY(1,1) PRIMARY KEY,
    RetailerId INT NOT NULL REFERENCES Retailers(RetailerId),
    DocumentType VARCHAR(50) NOT NULL 
        CHECK (DocumentType IN ('ShopDoc','AadharFront','AadharBack','PAN')),
    DocumentFile VARBINARY(MAX) NOT NULL,
    UploadedAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE RetailerStatusTracking (
    StatusId INT IDENTITY(1,1) PRIMARY KEY,
    RetailerId INT NOT NULL REFERENCES Retailers(RetailerId),
    Status VARCHAR(50) NOT NULL
        CHECK (Status IN ('Pending','Approved','Rejected')), 
    Remark VARCHAR(MAX) NULL,
    UpdatedAt DATETIME DEFAULT GETDATE()
);

/* Vendor Tables */
CREATE TABLE Vendors (
    VendorId INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL REFERENCES Users(UserId),
    BusinessName VARCHAR(200) NOT NULL,
    VendorName VARCHAR(150) NOT NULL,
    EmailAddress VARCHAR(150) NOT NULL,
    WhatsAppNumber VARCHAR(20) NOT NULL,
    Pincode VARCHAR(10) NOT NULL,
    BusinessAddress VARCHAR(MAX) NOT NULL,
    LiveLocationLatitude DECIMAL(10,7) NOT NULL,
    LiveLocationLongitude DECIMAL(10,7) NOT NULL,
    AadharCardNumber VARCHAR(12) NOT NULL UNIQUE,
    PANCardNumber VARCHAR(10) NOT NULL UNIQUE,
    GSTNumber VARCHAR(20) NOT NULL,
    DeclarationConfirmed BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE VendorBusinessPhotos (
    PhotoId INT IDENTITY(1,1) PRIMARY KEY,
    VendorId INT NOT NULL REFERENCES Vendors(VendorId),
    PhotoType VARCHAR(50) NOT NULL,
    BusinessPhoto VARBINARY(MAX) NOT NULL,
    UploadedAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE VendorDocuments (
    DocumentId INT IDENTITY(1,1) PRIMARY KEY,
    VendorId INT NOT NULL REFERENCES Vendors(VendorId),
    DocumentType VARCHAR(50) NOT NULL 
        CHECK (DocumentType IN ('BusinessDoc','AadharFront','AadharBack','PAN')),
    DocumentFile VARBINARY(MAX) NOT NULL,
    UploadedAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE VendorStatusTracking (
    StatusId INT IDENTITY(1,1) PRIMARY KEY,
    VendorId INT NOT NULL REFERENCES Vendors(VendorId),
    Status VARCHAR(50) NOT NULL
        CHECK (Status IN ('Pending','Approved','Rejected')),
    Remark VARCHAR(MAX) NULL,
    UpdatedAt DATETIME DEFAULT GETDATE()
);
