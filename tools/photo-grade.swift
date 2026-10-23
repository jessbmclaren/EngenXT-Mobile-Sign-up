// Re-grades the background of a photo so it looks lit, not edited: the people stay as they are,
// everything behind them keeps its own light and texture but is mapped onto a muted tone
// (deep navy, teal, graphite or a light studio grey), with soft light falling from above.
// usage: swift photo-grade.swift in.jpg out.jpg #darkhex #lighthex [strength 0..1, default .85] [tint fix, default 0]
// tint fix: corrects a colour cast on the people (negative pulls magenta toward green), for photos graded before
import Foundation
import CoreImage
import Vision

let a = CommandLine.arguments
let inURL = URL(fileURLWithPath: a[1]), outURL = URL(fileURLWithPath: a[2])
func col(_ h: String) -> CIColor {
    let v = Int(h.dropFirst(), radix: 16)!
    return CIColor(red: CGFloat((v >> 16) & 255) / 255, green: CGFloat((v >> 8) & 255) / 255, blue: CGFloat(v & 255) / 255)
}
let dark = col(a[3]), light = col(a[4])
let strength = a.count > 5 ? Double(a[5])! : 0.85
let tintFix = a.count > 6 ? Double(a[6])! : 0

guard let img = CIImage(contentsOf: inURL) else { fatalError("cannot read \(a[1])") }
let ext = img.extent

// 1. who is in the picture
let req = VNGeneratePersonSegmentationRequest()
req.qualityLevel = .accurate
req.outputPixelFormat = kCVPixelFormatType_OneComponent8
try VNImageRequestHandler(url: inURL).perform([req])
guard let buf = req.results?.first?.pixelBuffer else { fatalError("no people found in \(a[1])") }
var mask = CIImage(cvPixelBuffer: buf)
mask = mask.transformed(by: CGAffineTransform(scaleX: ext.width / mask.extent.width, y: ext.height / mask.extent.height))
// a pixel or two inside the edge, so any old colour fringe is re-graded with the background
mask = mask.applyingFilter("CIMorphologyMinimum", parameters: ["inputRadius": 2]).clampedToExtent().applyingGaussianBlur(sigma: 2.2).cropped(to: ext)

// 2. the background's own light, without the people bleeding into it
let black = CIImage(color: .black).cropped(to: ext)
let keep = mask.applyingFilter("CIMorphologyMaximum", parameters: ["inputRadius": 8]).applyingFilter("CIColorInvert").cropped(to: ext)
let holed = img.applyingFilter("CIBlendWithMask", parameters: [kCIInputBackgroundImageKey: black, kCIInputMaskImageKey: keep]).cropped(to: ext)
let num = holed.clampedToExtent().applyingGaussianBlur(sigma: 10).cropped(to: ext)
let den = keep.clampedToExtent().applyingGaussianBlur(sigma: 10).cropped(to: ext)
    .applyingFilter("CIColorClamp", parameters: ["inputMinComponents": CIVector(x: 0.02, y: 0.02, z: 0.02, w: 1)])
let filled = den.applyingFilter("CIDivideBlendMode", parameters: [kCIInputBackgroundImageKey: num]).cropped(to: ext)
// behind the people use the filled-in background; elsewhere keep the real detail
let bg = filled.applyingFilter("CIBlendWithMask", parameters: [kCIInputBackgroundImageKey: img, kCIInputMaskImageKey: keep.applyingFilter("CIColorInvert")]).cropped(to: ext)

// 3. map its light onto a muted tone: low contrast, low saturation, no glow
let lumaImg = bg.applyingFilter("CIColorControls", parameters: ["inputSaturation": 0, "inputContrast": 0.92])
let toned = lumaImg.applyingFilter("CIFalseColor", parameters: ["inputColor0": dark, "inputColor1": light])
// keep a trace of the real colour so it never looks flat
let real = bg.applyingFilter("CIColorControls", parameters: ["inputSaturation": 0.35])
let mixAlpha = CIImage(color: CIColor(red: strength, green: strength, blue: strength)).cropped(to: ext)
var graded = toned.applyingFilter("CIBlendWithMask", parameters: [kCIInputBackgroundImageKey: real, kCIInputMaskImageKey: mixAlpha]).cropped(to: ext)

// soft light falling from the top, darker toward the bottom corners, like a real room or sky
let fall = CIFilter(name: "CILinearGradient", parameters: [
    "inputPoint0": CIVector(x: ext.midX, y: ext.maxY), "inputPoint1": CIVector(x: ext.midX, y: ext.minY),
    "inputColor0": CIColor(red: 1, green: 1, blue: 1, alpha: 0.10), "inputColor1": CIColor(red: 0, green: 0, blue: 0, alpha: 0.18)])!.outputImage!.cropped(to: ext)
graded = fall.applyingFilter("CISourceOverCompositing", parameters: [kCIInputBackgroundImageKey: graded]).cropped(to: ext)
graded = graded.applyingFilter("CIVignette", parameters: ["inputIntensity": 0.35, "inputRadius": 1.6]).cropped(to: ext)

// 4. a fine grain over the background only, so the grade reads as film, not a fill
let noise = CIFilter(name: "CIRandomGenerator")!.outputImage!.cropped(to: ext)
    .applyingFilter("CIColorControls", parameters: ["inputSaturation": 0, "inputBrightness": -0.5, "inputContrast": 1])
    .applyingFilter("CIColorMatrix", parameters: ["inputAVector": CIVector(x: 0, y: 0, z: 0, w: 0.035)])
graded = noise.applyingFilter("CISourceOverCompositing", parameters: [kCIInputBackgroundImageKey: graded]).cropped(to: ext)

// 5. the people go back on top, untouched apart from an optional cast correction
var people = img
if tintFix != 0 {
    people = img.applyingFilter("CITemperatureAndTint", parameters: ["inputNeutral": CIVector(x: 6500, y: 0), "inputTargetNeutral": CIVector(x: 6500, y: tintFix)])
        .applyingFilter("CIColorControls", parameters: ["inputSaturation": 0.92]).cropped(to: ext)
}
let out = people.applyingFilter("CIBlendWithMask", parameters: [kCIInputBackgroundImageKey: graded, kCIInputMaskImageKey: mask]).cropped(to: ext)
try CIContext().writeJPEGRepresentation(of: out, to: outURL, colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!,
    options: [kCGImageDestinationLossyCompressionQuality as CIImageRepresentationOption: 0.86])
print("wrote \(a[2])")
