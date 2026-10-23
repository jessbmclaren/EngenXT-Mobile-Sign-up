// Keeps the people in a photo as they are and turns everything behind them
// into a soft-focus duotone in one brand hue, so stock photos sit on our colour.
// usage: swift recolour.swift in.jpg out.jpg #darkhex #lighthex
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
mask = mask.clampedToExtent().applyingGaussianBlur(sigma: 1.6).cropped(to: ext)

// 2. the background: blurred with the people taken out first (so their clothes do not glow
//    around them), then mapped from the dark shade to the light shade of the hue
let black = CIImage(color: .black).cropped(to: ext)
let keep = mask.applyingFilter("CIMorphologyMaximum", parameters: ["inputRadius": 6]).applyingFilter("CIColorInvert").cropped(to: ext)
let holed = img.applyingFilter("CIBlendWithMask", parameters: [kCIInputBackgroundImageKey: black, kCIInputMaskImageKey: keep]).cropped(to: ext)
let num = holed.clampedToExtent().applyingGaussianBlur(sigma: 14).cropped(to: ext)
let den = keep.clampedToExtent().applyingGaussianBlur(sigma: 14).cropped(to: ext)
    .applyingFilter("CIColorClamp", parameters: ["inputMinComponents": CIVector(x: 0.02, y: 0.02, z: 0.02, w: 1)])
let soft = den.applyingFilter("CIDivideBlendMode", parameters: [kCIInputBackgroundImageKey: num]).cropped(to: ext)
var duo = soft
    .applyingFilter("CIColorControls", parameters: ["inputSaturation": 0, "inputContrast": 1.05, "inputBrightness": 0])
    .applyingFilter("CIFalseColor", parameters: ["inputColor0": dark, "inputColor1": light])
    .applyingFilter("CIColorControls", parameters: ["inputSaturation": 1.45, "inputContrast": 1.04])

// a soft studio light behind the people
let glow = CIFilter(name: "CIRadialGradient", parameters: [
    "inputCenter": CIVector(x: ext.midX, y: ext.minY + ext.height * 0.62),
    "inputRadius0": 0, "inputRadius1": max(ext.width, ext.height) * 0.62,
    "inputColor0": CIColor(red: 1, green: 1, blue: 1, alpha: 0.22),
    "inputColor1": CIColor(red: 1, green: 1, blue: 1, alpha: 0)])!.outputImage!.cropped(to: ext)
duo = glow.applyingFilter("CISoftLightBlendMode", parameters: [kCIInputBackgroundImageKey: duo])

// 3. a little of the hue in the people too, so they sit in the light
let person = img.applyingFilter("CIColorMatrix", parameters: [:])
    .applyingFilter("CISourceOverCompositing", parameters: [kCIInputBackgroundImageKey: img])
let tint = CIImage(color: CIColor(red: light.red, green: light.green, blue: light.blue, alpha: 0.08)).cropped(to: ext)
let lit = tint.applyingFilter("CISourceOverCompositing", parameters: [kCIInputBackgroundImageKey: person])

let out = lit.cropped(to: ext).applyingFilter("CIBlendWithMask", parameters: [kCIInputBackgroundImageKey: duo.cropped(to: ext), kCIInputMaskImageKey: mask]).cropped(to: ext)
try CIContext().writeJPEGRepresentation(of: out, to: outURL, colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!,
    options: [kCGImageDestinationLossyCompressionQuality as CIImageRepresentationOption: 0.84])
print("wrote \(a[2])")
