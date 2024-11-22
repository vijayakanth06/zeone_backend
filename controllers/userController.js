const User = require('../models/User');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

exports.createUser = async (req, res) => {
  try {
    const newUser = new User(req.body);
    const savedUser = await newUser.save();
    res.status(201).json(savedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedUser) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) return res.status(404).json({ message: 'User not found' });
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.getUniqueNames = async (req, res) => {
  try {
    const uniqueNames = await User.distinct('name');
    res.status(200).json(uniqueNames);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAverageScoresAndDurations = async (req, res) => {
  try {
    const results = await User.aggregate([
      {
        $group: {
          _id: '$name',
          averageScore: { $avg: '$score' },
          totalDuration: { $sum: '$duration' },
        },
      },
      {
        $project: {
          _id: 0,
          name: '$_id',
          averageScore: { $round: ['$averageScore', 2] },
          totalDuration: { $round: ['$totalDuration', 2] },
        },
      },
    ]);

    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.exportUserConversationsToPDF = async (req, res) => {
  try {
   
    const users = await User.find();

    const groupedUsers = users.reduce((acc, user) => {
      if (!acc[user.name]) {
        acc[user.name] = [];
      }
      acc[user.name].push({ user_msg: user.user_msg, ai: user.ai });
      return acc;
    }, {});

    const exportDir = path.join(__dirname, '..', 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir);
    }

    const pdfPaths = [];

    for (const [name, conversations] of Object.entries(groupedUsers)) {
      const doc = new PDFDocument({ margin: 40 });
      const fileName = `${name.replace(/ /g, '_')}_${Date.now()}.pdf`;
      const filePath = path.join(exportDir, fileName);
      pdfPaths.push(filePath);

      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      doc.fontSize(20).font('Helvetica-Bold').text(`Conversation with ${name}`, { align: 'center' });
      doc.moveDown(1);

      doc.fontSize(14).font('Helvetica-Bold').text('Name:', { continued: true });
      doc.fontSize(14).font('Helvetica').text(` ${name}`);
      doc.moveDown(0.5);

      doc.fontSize(12).font('Helvetica-Bold').text('User Message', { continued: false });
      doc.moveDown(0.2);
      doc.fontSize(12).font('Helvetica-Bold').text('AI Response', { continued: false });
      doc.moveDown(0.5);
      
      conversations.forEach((conv, index) => {
        doc.fontSize(12).font('Helvetica-Bold').text(`User Message ${index + 1}:`, { continued: true });
        doc.fontSize(12).font('Helvetica').text(`${conv.user_msg}`);
        doc.moveDown(0.3);
        doc.fontSize(12).font('Helvetica-Bold').text(`AI Response ${index + 1}:`, { continued: true });
        doc.fontSize(12).font('Helvetica').text(`${conv.ai}`);
        doc.moveDown(0.8);
      });

      doc.end();

      await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });
    }

    res.status(200).json({ message: 'PDFs generated successfully', files: pdfPaths });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};