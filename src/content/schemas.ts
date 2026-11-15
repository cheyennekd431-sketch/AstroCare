import { z } from 'zod';
export const schemas = {
  pages: {
    home: z.object({
      "mission": z.object({
        "astronaut": z.string(),
        "crew": z.string(),
        "day": z.number(),
        "dayLabel": z.string(),
        "headline": z.string(),
        "scanStatus": z.string(),
        "subhead": z.string(),
        "title": z.string()
      }),
      "scanner": z.object({
        "hint": z.string(),
        "layers": z.array(z.object({
          "desc": z.string(),
          "id": z.string(),
          "name": z.string()
        })),
        "regions": z.array(z.object({
          "carlitosNote": z.string(),
          "id": z.string(),
          "layer": z.string(),
          "metrics": z.array(z.object({
            "delta": z.string(),
            "id": z.string(),
            "label": z.string(),
            "value": z.string()
          })),
          "name": z.string(),
          "status": z.string(),
          "summary": z.string(),
          "trend": z.string()
        })),
        "title": z.string()
      }),
      "carlitos": z.object({
        "disclaimer": z.string(),
        "greeting": z.string(),
        "messages": z.array(z.object({
          "author": z.string(),
          "id": z.string(),
          "text": z.string()
        })),
        "name": z.string(),
        "placeholder": z.string(),
        "quickAsks": z.array(z.string()),
        "role": z.string()
      }),
      "emergency": z.object({
        "confirmText": z.string(),
        "intro": z.string(),
        "primaryAction": z.string(),
        "protocols": z.array(z.object({
          "id": z.string(),
          "summary": z.string(),
          "title": z.string()
        })),
        "secondaryAction": z.string(),
        "shareItems": z.array(z.object({
          "id": z.string(),
          "label": z.string(),
          "value": z.string()
        })),
        "shareTitle": z.string(),
        "title": z.string(),
        "triage": z.object({
          "burstNote": z.string(),
          "burstStatus": z.string(),
          "burstTitle": z.string(),
          "burstItems": z.array(z.object({
            "id": z.string(),
            "label": z.string(),
            "value": z.string()
          })),
          "commsAction": z.string(),
          "kitLabel": z.string(),
          "protocols": z.array(z.object({
            "id": z.string(),
            "kit": z.string(),
            "severity": z.string(),
            "steps": z.array(z.string()),
            "title": z.string(),
            "tone": z.string()
          })),
          "stepsLabel": z.string(),
          "subtitle": z.string(),
          "title": z.string(),
          "viewComms": z.string(),
          "viewTriage": z.string()
        })
      }),
      "statusbar": z.object({
        "sensors": z.array(z.object({
          "id": z.string(),
          "name": z.string(),
          "state": z.string()
        }))
      }),
      "vitals": z.array(z.object({
        "delta": z.string(),
        "id": z.string(),
        "label": z.string(),
        "note": z.string(),
        "series": z.array(z.number()),
        "status": z.string(),
        "unit": z.string(),
        "value": z.string()
      })),
      "watchlist": z.array(z.object({
        "id": z.string(),
        "level": z.string(),
        "text": z.string(),
        "title": z.string()
      }))
    }),
    history: z.object({
      "categories": z.array(z.object({
        "blurb": z.string(),
        "id": z.string(),
        "name": z.string(),
        "records": z.array(z.object({
          "date": z.string(),
          "day": z.string(),
          "detail": z.string(),
          "id": z.string(),
          "title": z.string()
        }))
      })),
      "header": z.object({
        "subtitle": z.string(),
        "syncNote": z.string(),
        "title": z.string()
      }),
      "months": z.array(z.string()),
      "symptoms": z.array(z.object({
        "date": z.string(),
        "duration": z.string(),
        "id": z.string(),
        "intensity": z.string(),
        "location": z.string(),
        "name": z.string(),
        "note": z.string()
      })),
      "timeline": z.array(z.object({
        "date": z.string(),
        "detail": z.string(),
        "id": z.string(),
        "kind": z.string(),
        "title": z.string()
      })),
      "timelineFilters": z.array(z.object({
        "id": z.string(),
        "label": z.string()
      })),
      "trends": z.array(z.object({
        "baseline": z.number(),
        "id": z.string(),
        "label": z.string(),
        "note": z.string(),
        "series": z.array(z.number()),
        "status": z.string(),
        "unit": z.string(),
        "value": z.string()
      }))
    }),
    wellbeing: z.object({
      "header": z.object({
        "checkinNote": z.string(),
        "privacyNote": z.string(),
        "subtitle": z.string(),
        "title": z.string()
      }),
      "questions": z.array(z.object({
        "dimension": z.string(),
        "id": z.string(),
        "options": z.array(z.object({
          "id": z.string(),
          "label": z.string(),
          "score": z.number()
        })),
        "question": z.string()
      })),
      "miniTest": z.object({
        "disclaimer": z.string(),
        "idleHint": z.string(),
        "normalText": z.string(),
        "watchText": z.string(),
        "reactionHow": z.string(),
        "traceHow": z.string(),
        "subtitle": z.string(),
        "title": z.string()
      }),
      "recommendations": z.array(z.object({
        "audience": z.string(),
        "id": z.string(),
        "text": z.string(),
        "title": z.string()
      })),
      "resultBands": z.array(z.object({
        "id": z.string(),
        "max": z.number(),
        "min": z.number(),
        "status": z.string(),
        "text": z.string(),
        "title": z.string()
      })),
      "vrRoom": z.object({
        "disclaimer": z.string(),
        "environments": z.array(z.object({
          "description": z.string(),
          "duration": z.string(),
          "id": z.string(),
          "name": z.string(),
          "soundscape": z.string()
        })),
        "note": z.string(),
        "subtitle": z.string(),
        "title": z.string()
      })
    }),
    radiation: z.object({
      "alarms": z.array(z.object({
        "id": z.string(),
        "level": z.string(),
        "text": z.string(),
        "title": z.string()
      })),
      "biomarkers": z.object({
        "footer": z.string(),
        "intro": z.string(),
        "items": z.array(z.object({
          "id": z.string(),
          "name": z.string(),
          "note": z.string(),
          "reference": z.string(),
          "series": z.array(z.number()),
          "status": z.string(),
          "value": z.string()
        })),
        "title": z.string()
      }),
      "campaigns": z.array(z.object({
        "date": z.string(),
        "id": z.string(),
        "label": z.string(),
        "neutrons": z.number(),
        "note": z.string(),
        "status": z.string()
      })),
      "explanation": z.object({
        "bioEffects": z.object({
          "text": z.string(),
          "title": z.string()
        }),
        "monitoring": z.object({
          "text": z.string(),
          "title": z.string()
        }),
        "units": z.array(z.object({
          "id": z.string(),
          "label": z.string(),
          "meaning": z.string()
        })),
        "title": z.string()
      }),
      "header": z.object({
        "subtitle": z.string(),
        "syncNote": z.string(),
        "title": z.string()
      }),
      "shielding": z.object({
        "comparison": z.array(z.object({
          "id": z.string(),
          "label": z.string(),
          "value": z.string()
        })),
        "id": z.string(),
        "lastUpdated": z.string(),
        "note": z.string(),
        "title": z.string()
      }),
      "sensors": z.array(z.object({
        "id": z.string(),
        "location": z.string(),
        "name": z.string(),
        "reading": z.string(),
        "series": z.array(z.number()),
        "status": z.string(),
        "trend": z.string()
      })),
      "trend": z.object({
        "label": z.string(),
        "months": z.array(z.string()),
        "note": z.string(),
        "series": z.array(z.number()),
        "unit": z.string(),
        "value": z.string()
      })
    }),
    environment: z.object({
      "header": z.object({
        "subtitle": z.string(),
        "syncNote": z.string(),
        "title": z.string()
      }),
      "air": z.object({
        "title": z.string(),
        "note": z.string(),
        "sensors": z.array(z.object({
          "id": z.string(),
          "name": z.string(),
          "note": z.string(),
          "reference": z.string(),
          "series": z.array(z.number()),
          "status": z.string(),
          "value": z.string()
        }))
      }),
      "swabs": z.object({
        "subtitle": z.string(),
        "title": z.string(),
        "mapNote": z.string(),
        "legend": z.array(z.object({
          "id": z.string(),
          "label": z.string(),
          "level": z.string()
        })),
        "points": z.array(z.object({
          "area": z.string(),
          "detail": z.string(),
          "id": z.string(),
          "lastChecked": z.string(),
          "result": z.string(),
          "x": z.number(),
          "y": z.number()
        }))
      }),
      "circadian": z.object({
        "subtitle": z.string(),
        "title": z.string(),
        "sleepSync": z.string(),
        "modes": z.array(z.object({
          "detail": z.string(),
          "hours": z.string(),
          "id": z.string(),
          "light": z.string(),
          "name": z.string()
        })),
        "schedule": z.array(z.object({
          "from": z.number(),
          "id": z.string(),
          "mode": z.string(),
          "to": z.number()
        }))
      })
    })
  }
};
export type Schemas = typeof schemas;