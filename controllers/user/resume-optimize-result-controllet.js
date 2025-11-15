const ResumeOptimizeResult = require("../../models/ResumeOptmizeResult");

const getResumeOptimizeResults = async (req, res) => {
  try {
    const history = await ResumeOptimizeResult.find({
      userId: req.session.user._id,
    }).sort({ createdAt: -1 });

    res.status(200).json({ history });
  } catch (error) {
    console.error("❌ Error fetching resume optimize results:", error);
    res
      .status(500)
      .json({ message: "Error fetching results", error: error.message });
  }
};

module.exports = {
  getResumeOptimizeResults,
};
