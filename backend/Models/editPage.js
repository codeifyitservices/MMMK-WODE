const mongoose = require("mongoose");

const editPageSchema = new mongoose.Schema({
  home: {
    banner: {
      title: {
        en: {
          type: String,
          trim: true,
        },
        ar: {
          type: String,
          trim: true,
        },
        fr: {
          type: String,
          trim: true,
        },
        ru: {
          type: String,
          trim: true,
        },
      },
      subtitle: {
        en: {
          type: String,
          trim: true,
        },
        ar: {
          type: String,
          trim: true,
        },
        fr: {
          type: String,
          trim: true,
        },
        ru: {
          type: String,
          trim: true,
        },
      },
      image: {
        type: String,
        default: null,
      },
      buttonText: {
        en: {
          type: String,
          trim: true,
        },
        ar: {
          type: String,
          trim: true,
        },
        fr: {
          type: String,
          trim: true,
        },
        ru: {
          type: String,
          trim: true,
        },
      },
      bubbleEnabled: {
        type: Boolean,
        default: false,
      },
      bubbleText: {
        type: String,
        trim: true,
        default: "",
      },
      bubbleLink: {
        type: String,
        trim: true,
        default: "",
      },
    },
    section2: {
      title: {
        en: {
          type: String,
          trim: true,
        },
        ar: {
          type: String,
          trim: true,
        },
        fr: {
          type: String,
          trim: true,
        },
        ru: {
          type: String,
          trim: true,
        },
      },
      subtitle: {
        en: {
          type: String,
          trim: true,
        },
        ar: {
          type: String,
          trim: true,
        },
        fr: {
          type: String,
          trim: true,
        },
        ru: {
          type: String,
          trim: true,
        },
      },
      leftImage: {
        type: String,
        default: null,
      },
      rightImage: {
        type: String,
        default: null,
      },
    },
    section8: {
      leftTitle: {
        en: {
          type: String,
          trim: true,
        },
        ar: {
          type: String,
          trim: true,
        },
        fr: {
          type: String,
          trim: true,
        },
        ru: {
          type: String,
          trim: true,
        },
      },
      leftSubtitle: {
        en: {
          type: String,
          trim: true,
        },
        ar: {
          type: String,
          trim: true,
        },
        fr: {
          type: String,
          trim: true,
        },
        ru: {
          type: String,
          trim: true,
        },
      },
      leftImage: {
        type: String,
      },
      rightTitle: {
        en: {
          type: String,
          trim: true,
        },
        ar: {
          type: String,
          trim: true,
        },
        fr: {
          type: String,
          trim: true,
        },
        ru: {
          type: String,
          trim: true,
        },
      },
      rightSubtitle: {
        en: {
          type: String,
          trim: true,
        },
        ar: {
          type: String,
          trim: true,
        },
        fr: {
          type: String,
          trim: true,
        },
        ru: {
          type: String,
          trim: true,
        },
      },
      rightImage: {
        type: String,
      },
      centerTitle: {
        en: {
          type: String,
          trim: true,
        },
        ar: {
          type: String,
          trim: true,
        },
        fr: {
          type: String,
          trim: true,
        },
        ru: {
          type: String,
          trim: true,
        },
      },
    },
    section9: {
      title: {
        en: {
          type: String,
          trim: true,
        },
        ar: {
          type: String,
          trim: true,
        },
        fr: {
          type: String,
          trim: true,
        },
        ru: {
          type: String,
          trim: true,
        },
      },
      subtitle: {
        en: {
          type: String,
          trim: true,
        },
        ar: {
          type: String,
          trim: true,
        },
        fr: {
          type: String,
          trim: true,
        },
        ru: {
          type: String,
          trim: true,
        },
      },
      image: {
        type: String,
        default: null,
      },
    },
    section11: {
      title: {
        en: {
          type: String,
          trim: true,
        },
        ar: {
          type: String,
          trim: true,
        },
        fr: {
          type: String,
          trim: true,
        },
        ru: {
          type: String,
          trim: true,
        },
      },
      subtitle: {
        en: {
          type: String,
          trim: true,
        },
        ar: {
          type: String,
          trim: true,
        },
        fr: {
          type: String,
          trim: true,
        },
        ru: {
          type: String,
          trim: true,
        },
      },
      image: {
        type: String,
        default: null,
      },
    },
    section12: {
      videos: {
        type: [String],
        default: [],
      },
    },
    sectionProducts: {
      section3_product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
      section7_product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    },
  },
  footer: {
    image: {
      type: String,
      default: null,
    },
    footerLinks: {
      type: [
        {
          text: {
            en: {
              type: String,
              trim: true,
            },
            ar: {
              type: String,
              trim: true,
            },
            fr: {
              type: String,
              trim: true,
            },
            ru: {
              type: String,
              trim: true,
            },
          },
          link: {
            type: String,
          },
        },
      ],
    },
    footerContent: {
      en: {
        type: String,
        trim: true,
      },
      ar: {
        type: String,
        trim: true,
      },
      fr: {
        type: String,
        trim: true,
      },
      ru: {
        type: String,
        trim: true,
      },
    },
    socialLinks: {
      facebook: {
        type: String,
      },
      instagram: {
        type: String,
      },
      snapchat: {
        type: String,
      },
      twitter: {
        type: String,
      },
    },
  },
});

module.exports = mongoose.model("EditPage", editPageSchema);
