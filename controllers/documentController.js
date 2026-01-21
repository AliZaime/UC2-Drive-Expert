const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const upload = require('../utils/cloudinary');
const PDFDocument = require('pdfkit');
const fs = require('fs');


exports.generateDocument = catchAsync(async (req, res, next) => {
    const doc = new PDFDocument();

    // Set headers for download
    const filename = `contract_${Date.now()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

    doc.pipe(res);

    // --- Header ---
    doc.fontSize(26).font('Helvetica-Bold').text('DRIVE EXPERT', { align: 'center', color: '#2c3e50' });
    doc.fontSize(12).font('Helvetica').text('Solutions de Reprise & Gestion de Flotte', { align: 'center' });
    doc.moveDown(2);

    // --- Title ---
    doc.fontSize(20).text('CONTRAT DE VENTE', { align: 'center', underline: true });
    doc.moveDown();

    // --- Details ---
    const date = new Date().toLocaleDateString('fr-FR');
    doc.fontSize(12).text(`Date d'émission : ${date}`);
    doc.text(`Réf Contrat : #AG-${Math.floor(Math.random() * 10000)}`);
    doc.moveDown();

    // --- Parties ---
    doc.rect(50, 230, 500, 100).stroke();
    doc.text('VENDEUR : Sogetrel / Drive Expert', 60, 245);
    doc.text('ACHETEUR : Mr/Mme ' + (req.body.clientName || 'Client Test'), 60, 265);
    
    // --- Vehicle Info ---
    doc.moveDown(4);
    doc.fontSize(14).text('OBJET DE LA VENTE :', { underline: true });
    doc.fontSize(12);
    doc.list([
        `Véhicule : ${req.body.vehicleModel || 'Renault Clio V'}`,
        `Immatriculation : ${req.body.vin || 'XX-123-YY'}`,
        `Prix Convenu : ${req.body.price || '12 500'} €`,
        `Kilométrage : ${req.body.mileage || '45 000'} km`
    ], { bulletRadius: 2 });
    doc.moveDown(2);

    // --- Legal Text ---
    doc.fontSize(10).text('Le présent contrat formalise l\'accord entre les parties pour la vente du véhicule désigné ci-dessus. Le véhicule est vendu en l\'état. Le paiement doit être effectué sous 7 jours.');
    
    // --- Signatures ---
    doc.moveDown(4);
    const y = doc.y;
    doc.text('Signature Vendeur', 100, y);
    doc.text('Signature Acheteur', 400, y);
    
    doc.rect(80, y + 20, 150, 50).stroke(); // Box Vendeur
    doc.rect(380, y + 20, 150, 50).stroke(); // Box Acheteur

    // --- Footer ---
    doc.fontSize(8).text('Drive Expert - SAS au capital de 50 000€ - Paris', 50, 700, { align: 'center', width: 500 });
    
    doc.end();
});


exports.uploadMiddleware = upload.single('file');

exports.uploadDocument = catchAsync(async (req, res, next) => {
    if (!req.file) {
        return next(new AppError('No file uploaded', 400));
    }

    res.status(200).json({ 
        status: 'success', 
        message: 'Document uploaded successfully',
        data: { 
            url: req.file.path,
            filename: req.file.filename
        } 
    });
});
