with open('src/lib/i18n/translations.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

detail_es = """      detail: {
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
"""

banner_es = """      bannerKycRequired: "No has completado la verificacion de identidad. Las funciones en cadena son limitadas.",
      bannerGoVerify: "Verificar Ahora",
"""

kyc_es = """    kyc: {
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

# Replace logic:
# - Line 3677 (0-indexed): '      detail: {' -> REPLACE with detail_es (includes closing '},')
#   Lines 3678-3712 are SKIPPED (handled by detail_es)
# - Lines 3713-3714: banner keys -> REPLACE with banner_es
# - Line 3717 (0-indexed): '    kyc: {' -> REPLACE with kyc_es (includes closing '},')
#   Lines 3718-3810 are SKIPPED (handled by kyc_es)

result = []
i = 0
while i < len(lines):
    if i == 3677:
        # Replace detail block (including closing brace at 3712)
        result.append(detail_es)
        i = 3713  # skip lines 3678-3712
    elif i == 3713:
        # Replace bannerKycRequired and bannerGoVerify
        result.append(banner_es)
        i = 3715  # skip lines 3713-3714
    elif i == 3717:
        # Replace kyc block (including closing brace at 3810)
        result.append(kyc_es)
        i = 3811  # skip lines 3718-3810
    else:
        result.append(lines[i])
        i += 1

with open('src/lib/i18n/translations.ts', 'w', encoding='utf-8') as f:
    f.writelines(result)

print("Done! File now has", len(result), "lines")
