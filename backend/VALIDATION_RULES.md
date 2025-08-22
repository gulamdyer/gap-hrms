# Employee Validation Rules

## Required Fields (Must be provided)

### Personal Information
- **firstName** (string, 2-50 characters)
  - Required: YES
  - Min length: 2 characters
  - Max length: 50 characters
  - Cannot be empty

- **lastName** (string, 2-50 characters)
  - Required: YES
  - Min length: 2 characters
  - Max length: 50 characters
  - Cannot be empty

## Optional Fields (Can be empty or null)

### Personal Information
- **legalName** (string, max 100 characters)
  - Required: NO
  - Max length: 100 characters
  - Can be empty

- **gender** (enum: 'MALE', 'FEMALE', 'OTHER', '')
  - Required: NO
  - Valid values: 'MALE', 'FEMALE', 'OTHER', or empty string
  - Can be empty

- **nationality** (string, max 50 characters)
  - Required: NO
  - Max length: 50 characters
  - Can be empty

- **dateOfBirth** (date format: YYYY-MM-DD)
  - Required: NO
  - Format: Must be YYYY-MM-DD if provided
  - Can be empty

- **birthPlace** (string, max 100 characters)
  - Required: NO
  - Max length: 100 characters
  - Can be empty

### Job Information
- **reportToId** (integer)
  - Required: NO
  - Must be a valid integer if provided
  - Can be empty

- **designation** (string, max 100 characters)
  - Required: NO
  - Max length: 100 characters
  - Can be empty

- **role** (string, max 100 characters)
  - Required: NO
  - Max length: 100 characters
  - Can be empty

- **position** (string, max 100 characters)
  - Required: NO
  - Max length: 100 characters
  - Can be empty

- **location** (string, max 100 characters)
  - Required: NO
  - Max length: 100 characters
  - Can be empty

- **costCenter** (string, max 50 characters)
  - Required: NO
  - Max length: 50 characters
  - Can be empty

- **dateOfJoining** (date format: YYYY-MM-DD)
  - Required: NO
  - Format: Must be YYYY-MM-DD if provided
  - Can be empty

- **probationDays** (integer, 0-365)
  - Required: NO
  - Range: 0 to 365 days
  - Can be empty

- **confirmDate** (date format: YYYY-MM-DD)
  - Required: NO
  - Format: Must be YYYY-MM-DD if provided
  - Can be empty

- **noticeDays** (integer, 0-365)
  - Required: NO
  - Range: 0 to 365 days
  - Can be empty

### Address Information
- **address** (string, max 1000 characters)
  - Required: NO
  - Max length: 1000 characters
  - Can be empty

- **pincode** (string, 6-10 characters)
  - Required: NO
  - Min length: 6 characters
  - Max length: 10 characters
  - Can be empty

- **city** (string, max 50 characters)
  - Required: NO
  - Max length: 50 characters
  - Can be empty

- **district** (string, max 50 characters)
  - Required: NO
  - Max length: 50 characters
  - Can be empty

- **state** (string, max 50 characters)
  - Required: NO
  - Max length: 50 characters
  - Can be empty

- **country** (string, max 50 characters)
  - Required: NO
  - Max length: 50 characters
  - Can be empty

- **phone** (string, max 20 characters)
  - Required: NO
  - Max length: 20 characters
  - Can be empty

- **mobile** (string, max 20 characters)
  - Required: NO
  - Max length: 20 characters
  - Can be empty

- **email** (email format)
  - Required: NO
  - Must be valid email format if provided
  - Can be empty

### Personal Details
- **fatherName** (string, max 100 characters)
  - Required: NO
  - Max length: 100 characters
  - Can be empty

- **maritalStatus** (enum: 'SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', '')
  - Required: NO
  - Valid values: 'SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', or empty string
  - Can be empty

- **spouseName** (string, max 100 characters)
  - Required: NO
  - Max length: 100 characters
  - Can be empty

- **religion** (string, max 50 characters)
  - Required: NO
  - Max length: 50 characters
  - Can be empty

### Legal Information
- **aadharNumber** (string, exactly 12 characters)
  - Required: NO
  - Must be exactly 12 characters if provided
  - Can be empty

- **panNumber** (string, exactly 10 characters)
  - Required: NO
  - Must be exactly 10 characters if provided
  - Can be empty

- **drivingLicenseNumber** (string, max 20 characters)
  - Required: NO
  - Max length: 20 characters
  - Can be empty

- **educationCertificateNumber** (string, max 50 characters)
  - Required: NO
  - Max length: 50 characters
  - Can be empty

### Bank Information
- **bankName** (string, max 100 characters)
  - Required: NO
  - Max length: 100 characters
  - Can be empty

- **branchName** (string, max 100 characters)
  - Required: NO
  - Max length: 100 characters
  - Can be empty

- **ifscCode** (string, exactly 11 characters)
  - Required: NO
  - Must be exactly 11 characters if provided
  - Can be empty

- **accountNumber** (string, max 50 characters)
  - Required: NO
  - Max length: 50 characters
  - Can be empty

- **uanNumber** (string, max 20 characters)
  - Required: NO
  - Max length: 20 characters
  - Can be empty

- **pfNumber** (string, max 20 characters)
  - Required: NO
  - Max length: 20 characters
  - Can be empty

- **esiNumber** (string, max 20 characters)
  - Required: NO
  - Max length: 20 characters
  - Can be empty

### System Information
- **status** (enum: 'ACTIVE', 'INACTIVE', 'TERMINATED', 'ONBOARDING')
  - Required: NO
  - Valid values: 'ACTIVE', 'INACTIVE', 'TERMINATED', 'ONBOARDING'
  - Default: 'ONBOARDING'

## Common Validation Errors

1. **Missing Required Fields**
   - firstName: "First name is required"
   - lastName: "Last name is required"

2. **Length Validation**
   - firstName: "First name must be between 2 and 50 characters"
   - lastName: "Last name must be between 2 and 50 characters"

3. **Date Format Errors**
   - dateOfBirth: "Invalid date of birth format"
   - dateOfJoining: "Invalid date of joining format"
   - confirmDate: "Invalid confirm date format"

4. **Number Format Errors**
   - reportToId: "Invalid report to ID"
   - probationDays: "Probation days must be between 0 and 365"
   - noticeDays: "Notice days must be between 0 and 365"

5. **Email Format Errors**
   - email: "Invalid email format"

6. **Enum Value Errors**
   - gender: "Invalid gender"
   - maritalStatus: "Invalid marital status"
   - status: "Invalid status"

7. **Exact Length Errors**
   - aadharNumber: "Aadhar number must be 12 digits"
   - panNumber: "PAN number must be 10 characters"
   - ifscCode: "IFSC code must be 11 characters"

## Minimum Valid Employee Data

To create an employee successfully, you only need:

```json
{
  "firstName": "John",
  "lastName": "Doe"
}
```

All other fields are optional and can be empty or null. 