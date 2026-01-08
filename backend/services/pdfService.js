const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Service pour générer des PDF de tickets de commande
class PDFService {
  // Générer un ticket de commande
  generateOrderTicket(order) {
    return new Promise((resolve, reject) => {
      try {
        // Créer un nouveau document PDF
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          info: {
            Title: `Commande ${order._id}`,
            Author: 'Rouna E-commerce',
            Subject: 'Ticket de commande'
          }
        });

        const buffers = [];

        // Collecter les données du PDF
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });

        doc.on('error', reject);

        // En-tête du ticket
        this.addHeader(doc);

        // Informations de la commande
        this.addOrderInfo(doc, order);

        // Adresse de livraison et facturation
        this.addAddresses(doc, order);

        // Détails des articles
        this.addOrderItems(doc, order);

        // Résumé des prix
        this.addPriceSummary(doc, order);

        // Pied de page
        this.addFooter(doc);

        // Finaliser le PDF
        doc.end();

      } catch (error) {
        reject(error);
      }
    });
  }

  // Ajouter l'en-tête
  addHeader(doc) {
    // Logo et titre
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .text('ROUNA', 50, 50);

    doc.fontSize(14)
       .font('Helvetica')
       .text('Accessoires de Mode', 50, 75);

    doc.fontSize(10)
       .text('Tunis, Tunisie', 50, 90);

    // Ligne de séparation
    doc.moveTo(50, 120)
       .lineTo(550, 120)
       .stroke();

    // Titre du ticket
    doc.fontSize(18)
       .font('Helvetica-Bold')
       .text('TICKET DE COMMANDE', 50, 140, { align: 'center' });

    doc.moveTo(50, 170)
       .lineTo(550, 170)
       .stroke();
  }

  // Ajouter les informations de la commande
  addOrderInfo(doc, order) {
    const startY = 190;

    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('Informations de la commande', 50, startY);

    doc.fontSize(10)
       .font('Helvetica')
       .text(`Numéro de commande: ${order._id}`, 50, startY + 20);

    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('fr-FR')} à ${new Date(order.createdAt).toLocaleTimeString('fr-FR')}`, 50, startY + 35);

    doc.text(`Statut: ${this.getStatusText(order.orderStatus)}`, 50, startY + 50);

    doc.text(`Paiement: ${this.getPaymentMethodText(order.paymentMethod)}`, 50, startY + 65);

    doc.text(`Livraison: ${this.getShippingMethodText(order.shippingMethod)}`, 50, startY + 80);

    if (order.trackingNumber) {
      doc.text(`Numéro de suivi: ${order.trackingNumber}`, 50, startY + 95);
    }
  }

  // Ajouter les adresses
  addAddresses(doc, order) {
    const startY = 320;

    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('Adresse de livraison', 50, startY);

    doc.fontSize(10)
       .font('Helvetica')
       .text(order.shippingAddress.name, 50, startY + 20);

    doc.text(order.shippingAddress.street, 50, startY + 35);
    doc.text(`${order.shippingAddress.city}, ${order.shippingAddress.postalCode}`, 50, startY + 50);
    doc.text(order.shippingAddress.country, 50, startY + 65);

    if (order.shippingAddress.phone) {
      doc.text(`Tél: ${order.shippingAddress.phone}`, 50, startY + 80);
    }

    // Adresse de facturation (si différente)
    if (order.billingAddress && order.billingAddress.street !== order.shippingAddress.street) {
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text('Adresse de facturation', 300, startY);

      doc.fontSize(10)
         .font('Helvetica')
         .text(order.billingAddress.name, 300, startY + 20);

      doc.text(order.billingAddress.street, 300, startY + 35);
      doc.text(`${order.billingAddress.city}, ${order.billingAddress.postalCode}`, 300, startY + 50);
      doc.text(order.billingAddress.country, 300, startY + 65);

      if (order.billingAddress.phone) {
        doc.text(`Tél: ${order.billingAddress.phone}`, 300, startY + 80);
      }
    }
  }

  // Ajouter les articles de la commande
  addOrderItems(doc, order) {
    const startY = 450;

    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('Articles commandés', 50, startY);

    // En-têtes du tableau
    const tableTop = startY + 25;
    doc.fontSize(9)
       .font('Helvetica-Bold');

    doc.text('Article', 50, tableTop);
    doc.text('Qté', 350, tableTop);
    doc.text('Prix', 400, tableTop);
    doc.text('Total', 470, tableTop);

    // Ligne de séparation
    doc.moveTo(50, tableTop + 15)
       .lineTo(550, tableTop + 15)
       .stroke();

    // Articles
    let currentY = tableTop + 25;
    doc.font('Helvetica');

    order.items.forEach((item) => {
      doc.text(item.name, 50, currentY, { width: 290 });
      doc.text(item.quantity.toString(), 350, currentY);
      doc.text(`${item.price.toFixed(2)} DT`, 400, currentY);
      doc.text(`${item.total.toFixed(2)} DT`, 470, currentY);

      currentY += 20;
    });

    // Ligne finale
    doc.moveTo(50, currentY + 5)
       .lineTo(550, currentY + 5)
       .stroke();
  }

  // Ajouter le résumé des prix
  addPriceSummary(doc, order) {
    const startY = 650;

    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('Résumé', 350, startY);

    doc.fontSize(10)
       .font('Helvetica');

    doc.text(`Sous-total:`, 350, startY + 20);
    doc.text(`${order.subtotal.toFixed(2)} DT`, 470, startY + 20);

    doc.text(`Frais de livraison:`, 350, startY + 35);
    doc.text(`${order.shippingCost.toFixed(2)} DT`, 470, startY + 35);

    doc.text(`TVA (20%):`, 350, startY + 50);
    doc.text(`${order.tax.toFixed(2)} DT`, 470, startY + 50);

    if (order.discount > 0) {
      doc.text(`Réduction (${order.discountCode}):`, 350, startY + 65);
      doc.text(`-${order.discount.toFixed(2)} DT`, 470, startY + 65);
    }

    // Ligne de séparation
    doc.moveTo(350, startY + 80)
       .lineTo(550, startY + 80)
       .stroke();

    // Total
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('TOTAL:', 350, startY + 95);

    doc.text(`${order.total.toFixed(2)} DT`, 470, startY + 95);
  }

  // Ajouter le pied de page
  addFooter(doc) {
    const bottomY = doc.page.height - 100;

    doc.fontSize(10)
       .font('Helvetica')
       .text('Merci pour votre commande !', 50, bottomY, { align: 'center' });

    doc.text('Pour toute question, contactez-nous à contact@rouna.com', 50, bottomY + 20, { align: 'center' });

    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 50, bottomY + 40, { align: 'center' });

    // Ligne de séparation
    doc.moveTo(50, bottomY - 20)
       .lineTo(550, bottomY - 20)
       .stroke();
  }

  // Fonctions utilitaires pour les textes
  getStatusText(status) {
    const statusMap = {
      pending: 'En attente',
      processing: 'En traitement',
      shipped: 'Expédié',
      delivered: 'Livré',
      cancelled: 'Annulé'
    };
    return statusMap[status] || status;
  }

  getPaymentMethodText(method) {
    const methodMap = {
      card: 'Carte bancaire',
      paypal: 'PayPal',
      bank_transfer: 'Virement bancaire',
      cash_on_delivery: 'Paiement à la livraison'
    };
    return methodMap[method] || method;
  }

  getShippingMethodText(method) {
    const methodMap = {
      standard: 'Standard (5-7 jours)',
      express: 'Express (2-3 jours)',
      pickup: 'Retrait en magasin'
    };
    return methodMap[method] || method;
  }

  // Sauvegarder le PDF sur le disque (optionnel)
  savePDF(orderId, pdfBuffer) {
    const fileName = `order-${orderId}.pdf`;
    const filePath = path.join(__dirname, '../uploads/orders', fileName);

    // Créer le dossier s'il n'existe pas
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, pdfBuffer);
    return filePath;
  }
}

module.exports = new PDFService();
