"""
Fix translations.ts:
1. Fix en-US portraits.detail - remove duplicate line, restore English
2. Fix en-US kyc - remove duplicate line, restore English
3. Add portraits.detail and kyc Spanish blocks to es-ES section
"""
import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('src/lib/i18n/translations.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# ============================================================
# STEP 1: Fix en-US portraits.detail block
# The corrupted pattern starts with the duplicate "detail: {\n      detail: {"
# ============================================================

# Build the CORRECT English en-US portraits.detail block
en_portraits_detail = """      // Portrait detail page
      detail: {
        back: "Back",
        details: "Details",
        description: "Description",
        category: "Category",
        visibility: "Visibility",
        public: "Public",
        private: "Private",
        created: "Created",
        owner: "Owner",
        imageHash: "Image Hash (SHA-256)",
        notCertified: "Not Yet Certified",
        notCertifiedDesc: "Certify this portrait on Sepolia to create an immutable proof of authorship.",
        certifyOnBlockchain: "Certify on Blockchain",
        certifying: "Certifying...",
        imageHashNotAvailable: "Portrait image hash not available",
        edit: "Edit",
        archive: "Archive",
        archiving: "Archiving...",
        blockchainCertificate: "Blockchain Certificate",
        downloadCertificate: "Download Blockchain Certificate",
        network: "Network",
        txHash: "Tx Hash",
        ipfsCid: "On-Chain Hash",
        certifiedAt: "Certified At",
        certifyConfirm: "Certify this portrait on Sepolia? This will create an on-chain transaction.",
        certifyStepHash: "Calculating image hash...",
        certifyStepUploadMeta: "Saving metadata...",
        certifyStepMint: "Minting on Sepolia (confirm wallet)...",
        certifyStepConfirm: "Waiting for block confirmation...",
        certifySuccess: "Certified! Block #",
        certifyFailed: "Error: ",
        certifyNetworkError: "Network error. Please try again.",
        archiveConfirm: "Archive this portrait? It will be hidden but not permanently deleted.",
        download: "Download",
        localStorage: "Local Storage",
        portraitNotFound: "Local portrait not found",
        savedToDownloads: "Photo saved to downloads folder",
        downloadFailed: "Download failed, please try again",
        bannerKycRequired: "You have not completed identity verification. On-chain functions are limited.",
        bannerGoVerify: "Verify Now",
      },
    },
    // KYC"""

# The corrupted pattern to find and replace
# This is unique: the duplicate "detail: {" followed by Spanish text
old_portraits_detail = """      // Portrait detail page
      detail: {
      detail: {
        back: "Volver",
        details: "Detalles",
        description: "Descripcion",
        category: "Categoria",
        visibility: "Visibilidad",
        public: "Publico",
        private: "Privado",
        created: "Creado",
        owner: "Propietario",
        imageHash: "Hash de Imagen (SHA-256)",
        notCertified: "Aun No Certificado",
        notCertifiedDesc: "Certifica este retrato en Sepolia para crear una prueba inmutable de autoria.",
        certifyOnBlockchain: "Certificar en Blockchain",
        certifying: "Certificando...",
        imageHashNotAvailable: "Hash de imagen de retrato no disponible",
        edit: "Editar",
        archive: "Archivar",
        archiving: "Archivando...",
        blockchainCertificate: "Certificado de Blockchain",
        downloadCertificate: "Descargar Certificado de Blockchain",
        network: "Red",
        txHash: "Hash de Tx",
        ipfsCid: "Hash en Cadena",
        certifiedAt: "Certificado En",
        certifyConfirm: "Certificar este retrato en Sepolia? Esto creara una transaccion en cadena.",
        certifyStepHash: "Calculando hash de imagen...",
        certifyStepUploadMeta: "Guardando metadatos...",
        certifyStepMint: "Mintando en Sepolia (confirmando billetera)...",
        certifyStepConfirm: "Esperando confirmacion de bloque...",
        certifySuccess: "Certificado! Bloque #",
        certifyFailed: "Error: ",
        certifyNetworkError: "Error de red. Intenta de nuevo.",
        archiveConfirm: "Archivar este retrato? Estara oculto pero no eliminado permanentemente.",
      },
      bannerKycRequired: "No has completado la verificacion de identidad. Las funciones en cadena son limitadas.",
      bannerGoVerify: "Verificar Ahora",
    // KYC"""

old_kyc = """    // KYC
    kyc: {
    kyc: {
      title: "Verificacion de Identidad",
      subtitle: "Completa la verificacion de identidad para desbloquear todas las funciones",
      pending: "Verificacion Pendiente",
      approved: "Verificado",
      rejected: "Verificacion Rechazada",
      uploadId: "Subir ID",
      verify: "Iniciar Verificacion",
      step1Title: "Informacion Basica",
      step2Title: "Subir Documento",
      step3Title: "Verificacion Facial",
      step4Title: "Completado",
      supportedDocs: "Asegurate de que la foto sea clara y legible",
      frontSide: "Frente de ID",
      backSide: "Reverso de ID",
      backSideOptional: "Reverso de ID (Opcional)",
      submitDoc: "Enviar Documentos",
      submitting: "Enviando...",
      verificationPending: "Verificacion Pendiente",
      verificationApproved: "Verificacion Aprobada",
      verificationRejected: "Verificacion Rechazada",
      verificationRejectedDesc: "Tu verificacion fue rechazada. Por favor reenvia.",
      faceVerifyTitle: "Verificacion Facial",
      faceVerifyDesc: "Compararemos tu retrato con la foto de tu documento de identidad.",
      takePhoto: "Tomar Foto",
      uploadPhoto: "Subir Foto",
      retake: "Volver a Tomar",
      confirmPhoto: "Confirmar Foto",
      faceVerifyConfirm: "Confirmar y Enviar",
      verificationSuccess: "Verificacion Exitosa!",
      verificationSuccessDesc: "Tu identidad ha sido verificada. Ahora tienes acceso completo.",
      backToDashboard: "Volver al Panel",
      docType: "Tipo de Documento",
      docTypeIdCard: "Tarjeta de Identidad",
      docTypePassport: "Pasaporte",
      docTypeDriverLicense: "Licencia de Conducir",
      country: "Pais",
      countryPlaceholder: "Seleccionar pais",
      idNumber: "Numero de ID",
      idNumberPlaceholder: "Ingresa el numero de ID",
      idNumberHint: "Tu informacion esta encriptada y nunca se comparte.",
      selfieHint: "Toma un selfie claro sosteniendo tu documento de identidad",
      continue: "Continuar",
      verifyError: "Verificacion fallida. Por favor intenta de nuevo.",
      networkError: "Error de red. Por favor verifica tu conexion.",
      uploadProgress: "Subiendo...",
      verifyProgress: "Verificando...",
      alreadyVerified: "Ya Verificado",
      alreadyVerifiedDesc: "Tu identidad ha sido verificada.",
      statusApproved: "Aprobado",
      statusRejected: "Rechazado",
      statusPending: "Pendiente",
      statusExpired: "Expirado",
      warningNoKyc: "No has completado la verificacion de identidad y no puedes realizar la certificacion en blockchain.",
      goToKyc: "Verificar Ahora",
      clickToUpload: "Haz clic o arrastra para subir",
      maxFileSize: "Max 10MB, soporta JPG/PNG",
    },
    withdraw: {"""

en_kyc = """    // KYC
    kyc: {
      title: "Identity Verification",
      subtitle: "Complete identity verification to unlock all features",
      pending: "Verification Pending",
      approved: "Verified",
      rejected: "Verification Rejected",
      uploadId: "Upload ID",
      verify: "Start Verification",
      step1Title: "Basic Information",
      step2Title: "Upload Document",
      step3Title: "Face Verification",
      step4Title: "Completed",
      supportedDocs: "Make sure the photo is clear and legible",
      frontSide: "ID Front",
      backSide: "ID Back",
      backSideOptional: "ID Back (Optional)",
      submitDoc: "Submit Documents",
      submitting: "Submitting...",
      verificationPending: "Verification Pending",
      verificationApproved: "Verification Approved",
      verificationRejected: "Verification Rejected",
      verificationRejectedDesc: "Your verification was rejected. Please resubmit.",
      faceVerifyTitle: "Face Verification",
      faceVerifyDesc: "We will compare your portrait with your ID photo.",
      takePhoto: "Take Photo",
      uploadPhoto: "Upload Photo",
      retake: "Retake",
      confirmPhoto: "Confirm Photo",
      faceVerifyConfirm: "Confirm and Submit",
      verificationSuccess: "Verification Successful!",
      verificationSuccessDesc: "Your identity has been verified. You now have full access.",
      backToDashboard: "Back to Dashboard",
      docType: "Document Type",
      docTypeIdCard: "ID Card",
      docTypePassport: "Passport",
      docTypeDriverLicense: "Driver License",
      country: "Country",
      countryPlaceholder: "Select country",
      idNumber: "ID Number",
      idNumberPlaceholder: "Enter ID number",
      idNumberHint: "Your information is encrypted and never shared.",
      selfieHint: "Take a clear selfie holding your ID document",
      continue: "Continue",
      verifyError: "Verification failed. Please try again.",
      networkError: "Network error. Please check your connection.",
      uploadProgress: "Uploading...",
      verifyProgress: "Verifying...",
      alreadyVerified: "Already Verified",
      alreadyVerifiedDesc: "Your identity has been verified.",
      statusApproved: "Approved",
      statusRejected: "Rejected",
      statusPending: "Pending",
      statusExpired: "Expired",
      warningNoKyc: "You have not completed identity verification and cannot perform blockchain certification.",
      goToKyc: "Verify Now",
      clickToUpload: "Click or drag to upload",
      maxFileSize: "Max 10MB, supports JPG/PNG",
    },
    withdraw: {"""

# ============================================================
# STEP 2: Do the en-US replacements
# ============================================================

count1 = content.count(old_portraits_detail)
count2 = content.count(old_kyc)
print(f"Found {count1} instances of corrupted portraits.detail pattern")
print(f"Found {count2} instances of corrupted kyc pattern")

if count1 == 1:
    content = content.replace(old_portraits_detail, en_portraits_detail)
    print("Fixed en-US portraits.detail")
else:
    print(f"WARNING: Expected 1 instance of portraits.detail corruption, found {count1}")

if count2 == 1:
    content = content.replace(old_kyc, en_kyc)
    print("Fixed en-US kyc")
else:
    print(f"WARNING: Expected 1 instance of kyc corruption, found {count2}")

# ============================================================
# STEP 3: Add Spanish portraits and kyc to es-ES section
# The es-ES section starts with "es-ES": {
# We need to insert after the footer section, before enterpriseAgency
# ============================================================

es_portraits_spanish = """
    // Portraits
    portraits: {
      title: "Mis Retratos",
      subtitle: "Gestiona tu galeria de retratos",
      upload: "Subir Retrato",
      noPortraits: "Sin retratos aun, por favor sube",
      uploadNew: "Subir Nuevo Retrato",
      all: "Todos",
      draft: "Borrador",
      underReview: "En Revision",
      active: "Activo",
      suspended: "Suspendido",
      archived: "Archivado",
      total: "Total",
      onChain: "En Cadena",
      noResults: "No se encontraron resultados",
      tryDifferentKeyword: "Prueba con una palabra diferente",
      uploadFirstPortrait: "Sube tu primer retrato",
      searchPlaceholder: "Buscar retratos...",
      // Portrait detail page
      detail: {
        back: "Volver",
        details: "Detalles",
        description: "Descripcion",
        category: "Categoria",
        visibility: "Visibilidad",
        public: "Publico",
        private: "Privado",
        created: "Creado",
        owner: "Propietario",
        imageHash: "Hash de Imagen (SHA-256)",
        notCertified: "Aun No Certificado",
        notCertifiedDesc: "Certifica este retrato en Sepolia para crear una prueba inmutable de autoria.",
        certifyOnBlockchain: "Certificar en Blockchain",
        certifying: "Certificando...",
        imageHashNotAvailable: "Hash de imagen de retrato no disponible",
        edit: "Editar",
        archive: "Archivar",
        archiving: "Archivando...",
        blockchainCertificate: "Certificado de Blockchain",
        downloadCertificate: "Descargar Certificado de Blockchain",
        network: "Red",
        txHash: "Hash de Tx",
        ipfsCid: "Hash en Cadena",
        certifiedAt: "Certificado En",
        certifyConfirm: "Certificar este retrato en Sepolia? Esto creara una transaccion en cadena.",
        certifyStepHash: "Calculando hash de imagen...",
        certifyStepUploadMeta: "Guardando metadatos...",
        certifyStepMint: "Mintando en Sepolia (confirmando billetera)...",
        certifyStepConfirm: "Esperando confirmacion de bloque...",
        certifySuccess: "Certificado! Bloque #",
        certifyFailed: "Error: ",
        certifyNetworkError: "Error de red. Intenta de nuevo.",
        archiveConfirm: "Archivar este retrato? Estara oculto pero no eliminado permanentemente.",
        download: "Descargar",
        localStorage: "Almacenamiento Local",
        portraitNotFound: "Retrato local no encontrado",
        savedToDownloads: "Foto guardada en carpeta de descargas",
        downloadFailed: "Descarga fallida, por favor intenta de nuevo",
        bannerKycRequired: "No has completado la verificacion de identidad. Las funciones en cadena son limitadas.",
        bannerGoVerify: "Verificar Ahora",
      },
    },
    // KYC
    kyc: {
      title: "Verificacion de Identidad",
      subtitle: "Completa la verificacion de identidad para desbloquear todas las funciones",
      pending: "Verificacion Pendiente",
      approved: "Verificado",
      rejected: "Verificacion Rechazada",
      uploadId: "Subir ID",
      verify: "Iniciar Verificacion",
      step1Title: "Informacion Basica",
      step2Title: "Subir Documento",
      step3Title: "Verificacion Facial",
      step4Title: "Completado",
      supportedDocs: "Asegurate de que la foto sea clara y legible",
      frontSide: "Frente de ID",
      backSide: "Reverso de ID",
      backSideOptional: "Reverso de ID (Opcional)",
      submitDoc: "Enviar Documentos",
      submitting: "Enviando...",
      verificationPending: "Verificacion Pendiente",
      verificationApproved: "Verificacion Aprobada",
      verificationRejected: "Verificacion Rechazada",
      verificationRejectedDesc: "Tu verificacion fue rechazada. Por favor reenvia.",
      faceVerifyTitle: "Verificacion Facial",
      faceVerifyDesc: "Compararemos tu retrato con la foto de tu documento de identidad.",
      takePhoto: "Tomar Foto",
      uploadPhoto: "Subir Foto",
      retake: "Volver a Tomar",
      confirmPhoto: "Confirmar Foto",
      faceVerifyConfirm: "Confirmar y Enviar",
      verificationSuccess: "Verificacion Exitosa!",
      verificationSuccessDesc: "Tu identidad ha sido verificada. Ahora tienes acceso completo.",
      backToDashboard: "Volver al Panel",
      docType: "Tipo de Documento",
      docTypeIdCard: "Tarjeta de Identidad",
      docTypePassport: "Pasaporte",
      docTypeDriverLicense: "Licencia de Conducir",
      country: "Pais",
      countryPlaceholder: "Seleccionar pais",
      idNumber: "Numero de ID",
      idNumberPlaceholder: "Ingresa el numero de ID",
      idNumberHint: "Tu informacion esta encriptada y nunca se comparte.",
      selfieHint: "Toma un selfie claro sosteniendo tu documento de identidad",
      continue: "Continuar",
      verifyError: "Verificacion fallida. Por favor intenta de nuevo.",
      networkError: "Error de red. Por favor verifica tu conexion.",
      uploadProgress: "Subiendo...",
      verifyProgress: "Verificando...",
      alreadyVerified: "Ya Verificado",
      alreadyVerifiedDesc: "Tu identidad ha sido verificada.",
      statusApproved: "Aprobado",
      statusRejected: "Rechazado",
      statusPending: "Pendiente",
      statusExpired: "Expirado",
      warningNoKyc: "No has completado la verificacion de identidad y no puedes realizar la certificacion en blockchain.",
      goToKyc: "Verificar Ahora",
      clickToUpload: "Haz clic o arrastra para subir",
      maxFileSize: "Max 10MB, soporta JPG/PNG",
    },
"""

# Insert into es-ES: after "    },  \n    // Agency page" (end of footer section)
# The pattern is: footer closing }, followed by // Agency page
old_es_insertion_point = "    },\n    // Agency page"
new_es_insertion = f"    }},\n{es_portraits_spanish}\n    // Agency page"

count3 = content.count(old_es_insertion_point)
print(f"Found {count3} instances of es-ES insertion point")
if count3 == 1:
    content = content.replace(old_es_insertion_point, new_es_insertion)
    print("Added Spanish portraits and kyc to es-ES")
else:
    print(f"WARNING: Expected 1 insertion point, found {count3}")

# ============================================================
# STEP 4: Write the fixed file
# ============================================================
with open('src/lib/i18n/translations.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done!")

# Verify the fix
with open('src/lib/i18n/translations.ts', 'r', encoding='utf-8') as f:
    verify = f.read()
has_dup_detail = 'detail: {\n      detail: {' in verify
has_dup_kyc = 'kyc: {\n    kyc: {' in verify
has_en_back = '"back": "Back"' in verify
has_es_back = '"back": "Volver"' in verify
has_es_portraits = '"title": "Mis Retratos"' in verify
print(f"\nVerification:")
print(f"  No duplicate detail: {not has_dup_detail}")
print(f"  No duplicate kyc: {not has_dup_kyc}")
print(f"  en-US has English 'back': {has_en_back}")
print(f"  es-ES has Spanish 'Volver': {has_es_back}")
print(f"  es-ES has Spanish portraits: {has_es_portraits}")