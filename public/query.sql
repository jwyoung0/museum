SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[USER_ACCOUNT](
	[userID] [int] IDENTITY(1,1) NOT NULL,
	[username] [nvarchar](20) NOT NULL,
	[password] [nvarchar](12) NOT NULL,
	[role] [nvarchar](20) NULL,
	[personnelID] [int] NULL,
	[visitorID] [int] NULL,
	[isActive] [bit] NOT NULL,
 CONSTRAINT [PK_authentication] PRIMARY KEY CLUSTERED 
(
	[userID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO